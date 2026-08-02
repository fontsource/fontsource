import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { createFontContext, inspectFont } from '@fontsource-utils/core';
import type { GitSnapshot } from './git.ts';
import { normalizeInspection } from './inspection.ts';
import { type FamilyIcons, familyIconsSchema, familySchema } from './schema.ts';
import {
	compareStrings,
	normalizeText,
	readJson,
	sha256,
	writeJson,
} from './shared.ts';

const REPOSITORY = 'google/material-design-icons';
const PROJECT_URL = `https://github.com/${REPOSITORY}`;
const LICENSE = {
	id: 'Apache-2.0',
	url: 'https://www.apache.org/licenses/LICENSE-2.0',
} as const;
const TAGS = ['special-use/icons'] as const;
const CATEGORIES_PATH = 'update/current_versions.json';

type FamilyDefinition = {
	id: string;
	family: string;
	fontPath: string;
	set: 'icons' | 'symbols';
};

const FAMILIES: readonly FamilyDefinition[] = [
	{
		id: 'material-icons',
		family: 'Material Icons',
		fontPath: 'font/MaterialIcons-Regular.ttf',
		set: 'icons',
	},
	{
		id: 'material-icons-outlined',
		family: 'Material Icons Outlined',
		fontPath: 'font/MaterialIconsOutlined-Regular.otf',
		set: 'icons',
	},
	{
		id: 'material-icons-round',
		family: 'Material Icons Round',
		fontPath: 'font/MaterialIconsRound-Regular.otf',
		set: 'icons',
	},
	{
		id: 'material-icons-sharp',
		family: 'Material Icons Sharp',
		fontPath: 'font/MaterialIconsSharp-Regular.otf',
		set: 'icons',
	},
	{
		id: 'material-icons-two-tone',
		family: 'Material Icons Two Tone',
		fontPath: 'font/MaterialIconsTwoTone-Regular.otf',
		set: 'icons',
	},
	{
		id: 'material-symbols-outlined',
		family: 'Material Symbols Outlined',
		fontPath: 'variablefont/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].ttf',
		set: 'symbols',
	},
	{
		id: 'material-symbols-rounded',
		family: 'Material Symbols Rounded',
		fontPath: 'variablefont/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].ttf',
		set: 'symbols',
	},
	{
		id: 'material-symbols-sharp',
		family: 'Material Symbols Sharp',
		fontPath: 'variablefont/MaterialSymbolsSharp[FILL,GRAD,opsz,wght].ttf',
		set: 'symbols',
	},
];

const codepointsPath = (fontPath: string): string =>
	`${fontPath.slice(0, -extname(fontPath).length)}.codepoints`;

const readIconCategories = (snapshot: GitSnapshot) => {
	const contents = snapshot.read(CATEGORIES_PATH);
	const value: unknown = JSON.parse(contents.toString('utf8'));
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${CATEGORIES_PATH} is not an object`);
	}

	const categories = new Map<string, string[]>();
	for (const key of Object.keys(value)) {
		const [category, name, ...rest] = key.split('::');
		if (!category || !name || rest.length > 0) {
			throw new Error(`${CATEGORIES_PATH} has an invalid key: ${key}`);
		}
		const current = categories.get(name) ?? [];
		current.push(category);
		categories.set(name, current);
	}

	const changed = snapshot.lastChanged(CATEGORIES_PATH);
	return {
		categories,
		source: {
			revision: changed.revision,
			path: CATEGORIES_PATH,
			sha256: sha256(contents),
		},
	};
};

const readIcons = (
	snapshot: GitSnapshot,
	path: string,
): { manifest: FamilyIcons; modified: string } => {
	const categoryCatalog = readIconCategories(snapshot);
	const contents = snapshot.read(path);
	const icons = contents
		.toString('utf8')
		.trim()
		.split(/\r?\n/)
		.map((line, index) => {
			const match = line.match(/^(\S+)\s+([0-9a-fA-F]+)$/);
			if (!match?.[1] || !match[2]) {
				throw new Error(`${path}:${index + 1} is not a codepoint mapping`);
			}
			return {
				name: match[1],
				codepoint: Number.parseInt(match[2], 16),
				categories: categoryCatalog.categories.get(match[1]),
			};
		})
		.toSorted(
			(left, right) =>
				compareStrings(left.name, right.name) ||
				left.codepoint - right.codepoint,
		);
	const changed = snapshot.lastChanged(path);
	return {
		manifest: familyIconsSchema.parse({
			inputModes: ['codepoint', 'name-ligature'],
			icons,
			categoriesSource: categoryCatalog.source,
			source: {
				revision: changed.revision,
				path,
				sha256: sha256(contents),
			},
		}),
		modified: changed.date,
	};
};

const supportsCodepoint = (
	ranges: Awaited<ReturnType<typeof inspectFont>>['unicodeRanges'],
	codepoint: number,
): boolean =>
	ranges.some((range) =>
		typeof range === 'number'
			? range === codepoint
			: range[0] <= codepoint && codepoint <= range[1],
	);

const description = ({ family, set }: FamilyDefinition): string =>
	set === 'symbols'
		? `${family} is part of Google's current Material Symbols collection. It is a variable icon font with fill, weight, grade, and optical size axes.`
		: `${family} is part of Google's classic Material Icons collection. It is a static icon font at Regular weight; Google recommends Material Symbols for current icons.`;

const writeFamily = async (
	snapshot: GitSnapshot,
	root: string,
	ctx: ReturnType<typeof createFontContext>,
	definition: FamilyDefinition,
): Promise<void> => {
	const contents = snapshot.read(definition.fontPath);
	const inspected = await inspectFont(ctx, new Uint8Array(contents));
	const { manifest: icons, modified: iconsModified } = readIcons(
		snapshot,
		codepointsPath(definition.fontPath),
	);
	const missingCodepoints = new Set(
		icons.icons
			.map((icon) => icon.codepoint)
			.filter(
				(codepoint) => !supportsCodepoint(inspected.unicodeRanges, codepoint),
			),
	);
	if (missingCodepoints.size > 0) {
		throw new Error(
			`${definition.id} codepoint manifest references ${missingCodepoints.size} missing glyphs`,
		);
	}

	const changed = snapshot.lastChanged(definition.fontPath);
	const family = familySchema.parse({
		family: definition.family,
		status: 'active',
		provenance: {
			type: 'github',
			repository: REPOSITORY,
			revision: changed.revision,
			directory: dirname(definition.fontPath),
		},
		classifications: ['symbols'],
		tags: TAGS,
		languages: [],
		sourceModified: changed.date > iconsModified ? changed.date : iconsModified,
		license: LICENSE,
		project: { repository: PROJECT_URL },
		sources: [
			{
				path: definition.fontPath,
				sha256: sha256(contents),
				size: contents.byteLength,
				variant: { weight: 400, style: 'normal' },
				inspection: normalizeInspection(inspected),
			},
		],
	});
	const output = join(root, 'families', 'google-icons', definition.id);
	await mkdir(output, { recursive: true });
	await writeJson(join(output, 'family.json'), family);
	await writeJson(join(output, 'icons.json'), icons);
	await writeFile(
		join(output, 'description.en-US.md'),
		normalizeText(description(definition)),
	);
	await writeFile(
		join(output, 'license.txt'),
		normalizeText(snapshot.read('LICENSE').toString('utf8')),
	);
};

const currentFamilies = (
	snapshot: GitSnapshot,
): readonly FamilyDefinition[] => {
	const paths = new Set(snapshot.paths);
	const declaredPaths = new Set(
		FAMILIES.flatMap((family) => [
			family.fontPath,
			codepointsPath(family.fontPath),
		]),
	);
	const unknown = snapshot.paths.filter(
		(path) =>
			/^(?:font|variablefont)\/.+\.(?:codepoints|otf|ttf)$/.test(path) &&
			!declaredPaths.has(path),
	);
	if (unknown.length > 0) {
		throw new Error(`Unknown Google icon sources: ${unknown.join(', ')}`);
	}

	return FAMILIES.filter((family) => {
		const hasFont = paths.has(family.fontPath);
		const hasCodepoints = paths.has(codepointsPath(family.fontPath));
		if (hasFont !== hasCodepoints) {
			throw new Error(`${family.id} has an incomplete source pair`);
		}
		return hasFont;
	});
};

export const generateGoogleIcons = async (
	snapshot: GitSnapshot,
	root: string,
	previousFamilyIds: readonly string[],
): Promise<string[]> => {
	const families = currentFamilies(snapshot);
	const familyIds = new Set(previousFamilyIds);
	const ctx = createFontContext();
	try {
		for (const family of families) {
			await writeFamily(snapshot, root, ctx, family);
			familyIds.add(family.id);
		}
	} finally {
		ctx.destroy();
	}

	const currentIds = new Set(families.map((family) => family.id));
	for (const id of previousFamilyIds) {
		if (currentIds.has(id)) continue;
		const path = join(root, 'families', 'google-icons', id, 'family.json');
		const family = familySchema.parse(await readJson(path));
		await writeJson(path, { ...family, status: 'deprecated' });
	}

	return [...familyIds].toSorted(compareStrings);
};
