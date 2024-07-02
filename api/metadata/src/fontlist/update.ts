import type { FontVariants } from '../fonts/types';
import type { FontMetadata, FontsourceMetadata } from '../types';
import { METADATA_KEYS, METADATA_URL } from '../utils';
import type { Fontlist, FontlistQueries, MetadataList } from './types';

const generateFontVariants = ({
	id,
	subsets,
	weights,
	styles,
}: FontMetadata): FontVariants => {
	const variants: FontVariants = {};

	for (const weight of weights) {
		variants[weight] = variants[weight] || {};

		for (const style of styles) {
			variants[weight][style] = variants[weight][style] || {};

			for (const subset of subsets) {
				variants[weight][style][subset] = {
					url: {
						woff2: `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/${subset}-${weight}-${style}.woff2`,
						woff: `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/${subset}-${weight}-${style}.woff`,
						ttf: `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/${subset}-${weight}-${style}.ttf`,
					},
				};
			}
		}
	}

	return variants;
};

const updateMetadata = async (env: Env, ctx: ExecutionContext) => {
	const response = await fetch(METADATA_URL);
	const data = (await response.json()) as FontsourceMetadata;

	const dataWithVariants: MetadataList = {};

	for (const [key, value] of Object.entries(data)) {
		const variants = generateFontVariants(value);
		// Add variants to the metadata
		dataWithVariants[key] = {
			...value,
			variable: Boolean(value.variable),
			license: value.license.type,
			variants,
		};
	}

	// Save entire metadata into KV first
	ctx.waitUntil(
		env.METADATA.put(METADATA_KEYS.fonts, JSON.stringify(dataWithVariants)),
	);
	return dataWithVariants;
};

// This updates the fontlist dataset for a given key
const updateList = async (
	key: FontlistQueries,
	env: Env,
	ctx: ExecutionContext,
) => {
	const response = await fetch(METADATA_URL);
	const data = (await response.json()) as FontsourceMetadata;

	// Depending on key, generate a fontlist object with respective values
	const list: Fontlist = {};

	// Rewrite variable object to boolean state
	for (const value of Object.values(data)) {
		list[value.id] = key === 'variable' ? Boolean(value.variable) : value[key];
	}

	// Store the list in KV
	ctx.waitUntil(
		env.METADATA.put(METADATA_KEYS.fontlist(key), JSON.stringify(list)),
	);
	return list;
};

export { updateList, updateMetadata };
