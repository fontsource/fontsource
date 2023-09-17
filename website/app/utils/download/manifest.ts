import { type Metadata } from '../types';
import { bucketPath, listBucket } from './bucket';
import { splitTag } from './util';

export interface Manifest {
	id: string;
	subset: string;
	weight: number;
	style: string;
	variable: boolean;
	extension: string;
	version: string;
	url: string;
}

type ManifestGenerator = Omit<
	Metadata,
	| 'variants'
	| 'defSubset'
	| 'license'
	| 'type'
	| 'family'
	| 'lastModified'
	| 'category'
>;

export const generateManifestItem = async (
	tag: string,
	file: string,
	metadata: ManifestGenerator,
): Promise<Manifest> => {
	const { id, version } = await splitTag(tag);
	let [filename, extension] = file.split('.');
	const [subset, weight, style] = filename.split('-');
	if (!subset || !weight || !style) {
		throw new Response('Bad Request. Invalid filename.', { status: 400 });
	}

	if (id !== metadata.id) {
		throw new Response('Bad Request. Invalid ID.', { status: 400 });
	}

	// If the extension is ttf, change it to woff since jsdelivr doesn't store tff
	// and we convert it from woff to ttf on the fly
	if (extension === 'ttf') {
		extension = 'woff';
	}

	return {
		id,
		subset,
		weight: Number(weight),
		style,
		variable: metadata.variable,
		extension,
		version,
		url: `https://cdn.jsdelivr.net/npm/@fontsource/${id}@${version}/files/${id}-${file.replace(
			'.ttf',
			'.woff',
		)}`,
	};
};

export const generateManifest = async (
	tag: string,
	metadata: ManifestGenerator,
): Promise<Manifest[]> => {
	const { id, version } = await splitTag(tag);

	if (id !== metadata.id) {
		throw new Response(
			'Unprocessable Entity.. Provided tag does not match metadata ID.',
			{ status: 422 },
		);
	}

	// Generate manifest
	const manifest: Manifest[] = [];

	// Unicode range is needed to include numbered subset files, but it may include duplicates
	const subsetKeys = [
		...new Set([
			...Object.keys(metadata.unicodeRange).map(
				(key) => key.replace('[', '').replace(']', ''), // Files should be stored without brackets
			),
			...metadata.subsets,
		]),
	];

	for (const subset of subsetKeys) {
		for (const weight of metadata.weights) {
			for (const style of metadata.styles) {
				for (const extension of ['woff2', 'woff']) {
					manifest.push({
						id,
						subset,
						weight,
						style,
						variable: metadata.variable,
						extension,
						version,
						// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
						url: `https://cdn.jsdelivr.net/npm/@fontsource/${metadata.id}@${version}/files/${metadata.id}-${subset}-${weight}-${style}.${extension}`,
					});
				}
			}
		}
	}

	return manifest;
};

// Search for a list of existing files and prune out those that already exist
export const pruneManifest = async (
	id: string,
	version: string,
	baseManifest: Manifest[],
) => {
	const prefix = `${id}@${version}/`;
	const existingFiles = await listBucket(prefix);

	const manifest = baseManifest.filter((file) => {
		const existingFile = existingFiles.objects.find((existingFile) => {
			return existingFile === bucketPath(file);
		});

		return !existingFile;
	});

	return manifest;
};
