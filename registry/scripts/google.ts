import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { createFontContext, inspectFont } from '@fontsource-utils/core';
import TurndownService from 'turndown';
import type { GitSnapshot } from './git.ts';
import { normalizeInspection } from './inspection.ts';
import { loadProtoType, parseProto } from './protobuf.ts';
import {
	axisRegistrySchema,
	type FamilyInspection,
	type FamilyMetadata,
	familyInspectionSchema,
	familyMetadataSchema,
} from './schema.ts';
import {
	compareStrings,
	normalizeText,
	readJson,
	sha256,
	writeJson,
} from './shared.ts';

type GoogleFont = {
	filename: string;
	weight: number;
	style: 'normal' | 'italic';
	copyright?: string;
};

type GoogleFamily = {
	name: string;
	designer: string;
	license: string;
	category: string;
	dateAdded: string;
	fonts: GoogleFont[];
	subsets: string[];
	displayName?: string;
	project?: { repository: string; revision?: string };
};

type GoogleFamilyProto = {
	name: string;
	designer: string;
	license: string;
	category: string[];
	date_added: string;
	fonts: Array<{
		style: string;
		weight: number;
		filename: string;
		copyright?: string;
	}>;
	subsets: string[];
	display_name?: string;
	source?: { repository_url?: string; commit?: string };
};

type GoogleAxisProto = {
	tag?: string;
	display_name?: string;
	description?: string;
	min_value?: number;
	max_value?: number;
	default_value?: number;
	precision?: number;
};

const familyProto = loadProtoType(
	'./proto/google-fonts.proto',
	'google.fonts_public.FamilyProto',
);
const axisProto = loadProtoType('./proto/google-axis.proto', 'AxisProto');

const normalizeProject = (
	repository: string | undefined,
	revision: string | undefined,
): GoogleFamily['project'] => {
	if (!repository) return undefined;
	const url = new URL(repository);
	if (url.protocol !== 'https:') {
		throw new Error(`Unsupported project URL ${repository}`);
	}
	return {
		repository: url.toString().replace(/\/$/, ''),
		...(revision?.trim() ? { revision: revision.trim() } : {}),
	};
};

export const parseGoogleFamily = (source: string): GoogleFamily => {
	const family = parseProto<GoogleFamilyProto>(familyProto, source);
	const category = family.category.at(-1);
	if (!category) throw new Error('Missing Google category');

	const fonts = family.fonts.map((font): GoogleFont => {
		const style = font.style;
		if (style !== 'normal' && style !== 'italic') {
			throw new Error(`Unsupported Google font style ${style}`);
		}
		return {
			filename: font.filename,
			weight: font.weight,
			style,
			...(font.copyright ? { copyright: font.copyright } : {}),
		};
	});
	if (fonts.length === 0)
		throw new Error('Google family has no declared fonts');

	const project = family.source
		? normalizeProject(family.source.repository_url, family.source.commit)
		: undefined;

	return {
		name: family.name,
		designer: family.designer,
		license: family.license,
		category,
		dateAdded: family.date_added,
		fonts,
		subsets: family.subsets,
		...(family.display_name ? { displayName: family.display_name } : {}),
		...(project ? { project } : {}),
	};
};

const CATEGORY_MAP: Record<string, FamilyMetadata['category']> = {
	DISPLAY: 'display',
	HANDWRITING: 'handwriting',
	MONOSPACE: 'monospace',
	SANS_SERIF: 'sans-serif',
	SERIF: 'serif',
};

const LICENSES: Record<
	string,
	{ id: string; url: string; filenames: string[] }
> = {
	APACHE2: {
		id: 'Apache-2.0',
		url: 'https://www.apache.org/licenses/LICENSE-2.0',
		filenames: ['LICENSE.txt'],
	},
	OFL: {
		id: 'OFL-1.1',
		url: 'https://openfontlicense.org/open-font-license-official-text/',
		filenames: ['OFL.txt'],
	},
	UFL: {
		id: 'UFL-1.0',
		url: 'https://ubuntu.com/legal/font-licence',
		filenames: ['UFL.txt', 'LICENCE.txt'],
	},
};

const DOCUMENTS = [
	['DESCRIPTION.en_us.html', 'description.en-US.md'],
	['article/ARTICLE.en_us.html', 'article.en-US.md'],
] as const;

const turndown = new TurndownService({
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
	headingStyle: 'atx',
});
turndown.remove([
	'script',
	'style',
	'iframe',
	'object',
	'embed',
	'img',
	'video',
	'audio',
	'source',
	'form',
	'input',
	'button',
	'svg',
	'canvas',
] as TurndownService.Filter);
turndown.addRule('safe-links', {
	filter: 'a',
	replacement: (content, node) => {
		const href = node.getAttribute('href');
		if (!href) return content;
		const url = URL.parse(href);
		return url?.protocol === 'http:' || url?.protocol === 'https:'
			? `[${content}](${url.toString()})`
			: content;
	},
});

const htmlToMarkdown = (html: string): string =>
	normalizeText(turndown.turndown(html));

type GoogleFamilyDirectory = {
	directory: string;
	family: GoogleFamily;
	files: ReadonlySet<string>;
};

const readGoogleFamilies = (
	snapshot: GitSnapshot,
): Map<string, GoogleFamilyDirectory> => {
	const filesByDirectory = new Map<string, Set<string>>();
	for (const path of snapshot.paths) {
		const match = path.match(/^(ofl|apache|ufl)\/([^/]+)\//);
		if (!match?.[2]) continue;
		const directory = `${match[1]}/${match[2]}`;
		const files = filesByDirectory.get(directory) ?? new Set<string>();
		files.add(path);
		filesByDirectory.set(directory, files);
	}

	const families = new Map<string, GoogleFamilyDirectory>();
	for (const [directory, files] of filesByDirectory) {
		if (directory.endsWith('_todelist')) continue;
		const path = `${directory}/METADATA.pb`;
		if (!files.has(path)) continue;
		const family = parseGoogleFamily(snapshot.read(path).toString('utf8'));
		const id = family.name.toLowerCase().replace(/\s+/g, '-');
		const previous = families.get(id);
		if (previous && previous.directory !== directory) {
			throw new Error(
				`Duplicate normalized family ID ${id}: ${previous.directory} and ${directory}`,
			);
		}
		families.set(id, { directory, family, files });
	}
	return families;
};

const writeAxisRegistry = async (
	snapshot: GitSnapshot,
	root: string,
): Promise<void> => {
	const axisPaths = snapshot.paths.filter((path) =>
		/^axisregistry\/Lib\/axisregistry\/data\/[^/]+\.textproto$/.test(path),
	);
	if (axisPaths.length === 0)
		throw new Error('No Google axis registry files found');
	const registry: Record<string, unknown> = {};
	for (const path of axisPaths) {
		const axis = parseProto<GoogleAxisProto>(
			axisProto,
			snapshot.read(path).toString('utf8'),
		);
		const tag = axis.tag ?? '';
		registry[tag] = {
			name: axis.display_name,
			description: axis.description,
			min: axis.min_value,
			max: axis.max_value,
			default: axis.default_value,
			precision: axis.precision,
		};
	}
	await writeJson(join(root, 'axes.json'), axisRegistrySchema.parse(registry));
};

const inspectFamilySources = async (
	snapshot: GitSnapshot,
	id: string,
	source: GoogleFamilyDirectory,
	ctx: ReturnType<typeof createFontContext>,
): Promise<{
	sourceFiles: FamilyMetadata['sourceFiles'];
	inspectionFiles: FamilyInspection['files'];
}> => {
	const { directory, family, files } = source;
	const sourcePaths = new Set<string>();
	const declaredVariants = new Map<string, GoogleFont>();

	for (const font of family.fonts) {
		if (basename(font.filename) !== font.filename) {
			throw new Error(`${id} declares non-root font path ${font.filename}`);
		}
		const path = `${directory}/${font.filename}`;
		if (!files.has(path)) {
			throw new Error(`${id} is missing declared source ${path}`);
		}
		sourcePaths.add(path);
		declaredVariants.set(path, font);
	}

	for (const path of files) {
		if (path.startsWith(`${directory}/static/`) && path.endsWith('.ttf')) {
			sourcePaths.add(path);
		}
	}

	const sourceFiles: FamilyMetadata['sourceFiles'] = [];
	const inspectionFiles: FamilyInspection['files'] = [];

	// Keep inspection sequential: a single source face can already be memory-heavy.
	for (const path of Array.from(sourcePaths).toSorted(compareStrings)) {
		const contents = snapshot.read(path);
		const declared = declaredVariants.get(path);
		sourceFiles.push({
			path,
			sha256: sha256(contents),
			size: contents.byteLength,
			...(declared
				? { variant: { weight: declared.weight, style: declared.style } }
				: {}),
		});
		inspectionFiles.push(
			normalizeInspection(
				path,
				await inspectFont(ctx, new Uint8Array(contents)),
			),
		);
	}

	return { sourceFiles, inspectionFiles };
};

const writeFamily = async (
	snapshot: GitSnapshot,
	id: string,
	source: GoogleFamilyDirectory,
	root: string,
	ctx: ReturnType<typeof createFontContext>,
): Promise<void> => {
	const { directory, family: google, files } = source;
	const category = CATEGORY_MAP[google.category];
	if (!category)
		throw new Error(`${id} has unsupported category ${google.category}`);
	const license = LICENSES[google.license];
	if (!license)
		throw new Error(`${id} has unsupported license ${google.license}`);
	const licensePath = license.filenames
		.map((filename) => `${directory}/${filename}`)
		.find((path) => files.has(path));

	const { sourceFiles, inspectionFiles } = await inspectFamilySources(
		snapshot,
		id,
		source,
		ctx,
	);

	const copyrights = Array.from(
		new Set(
			google.fonts
				.map((font) => font.copyright?.trim())
				.filter((value): value is string => Boolean(value)),
		),
	).toSorted(compareStrings);
	const lastChanged = snapshot.lastChanged(directory);
	const metadata = familyMetadataSchema.parse({
		id,
		family: google.name,
		...(google.displayName && google.displayName !== google.name
			? { displayName: google.displayName }
			: {}),
		category,
		designer: google.designer,
		dateAdded: google.dateAdded,
		sourceModified: lastChanged.date,
		license: {
			id: license.id,
			url: license.url,
			...(copyrights.length > 0 ? { attribution: copyrights.join('\n') } : {}),
		},
		origin: {
			upstream: 'googleFonts',
			revision: lastChanged.revision,
			directory,
			available: true,
		},
		...(google.project ? { project: google.project } : {}),
		declaredSubsets: Array.from(new Set(google.subsets)).toSorted(
			compareStrings,
		),
		sourceFiles,
	});
	const inspection = familyInspectionSchema.parse({
		files: inspectionFiles,
	});
	const output = join(root, 'families', id);
	await mkdir(output, { recursive: true });
	await writeJson(join(output, 'metadata.json'), metadata);
	await writeJson(join(output, 'inspection.json'), inspection);
	if (licensePath) {
		await writeFile(
			join(output, 'license.txt'),
			normalizeText(snapshot.read(licensePath).toString('utf8')),
		);
	} else {
		await rm(join(output, 'license.txt'), { force: true });
	}

	for (const [sourcePath, outputName] of DOCUMENTS) {
		const path = `${directory}/${sourcePath}`;
		if (files.has(path)) {
			await writeFile(
				join(output, outputName),
				htmlToMarkdown(snapshot.read(path).toString('utf8')),
			);
		} else {
			await rm(join(output, outputName), { force: true });
		}
	}
};

export const generateGoogle = async (
	snapshot: GitSnapshot,
	root: string,
	previousFamilyIds: readonly string[],
): Promise<string[]> => {
	const families = readGoogleFamilies(snapshot);
	const familyIds = new Set(previousFamilyIds);
	const ctx = createFontContext();

	try {
		for (const [id, family] of Array.from(families).toSorted(
			([left], [right]) => compareStrings(left, right),
		)) {
			await writeFamily(snapshot, id, family, root, ctx);
			familyIds.add(id);
		}
	} finally {
		ctx.destroy();
	}

	for (const id of previousFamilyIds) {
		if (families.has(id)) continue;
		const metadataPath = join(root, 'families', id, 'metadata.json');
		const metadata = familyMetadataSchema.parse(await readJson(metadataPath));
		if (metadata.origin.available) {
			await writeJson(metadataPath, {
				...metadata,
				origin: { ...metadata.origin, available: false },
			});
		}
	}

	await writeAxisRegistry(snapshot, root);
	return Array.from(familyIds).toSorted(compareStrings);
};
