import { getOrUpdateMetadata } from '../fontlist/get';
import type { FontMetadata } from '../types';
import type { ArrayMetadata, FontVariants, IDResponse } from './types';

// This updates the main array of fonts dataset
const updateArrayMetadata = async (env: Env, ctx: ExecutionContext) => {
	const data = await getOrUpdateMetadata(env, ctx);

	// v1 Response
	const list: ArrayMetadata = [];

	for (const value of Object.values(data)) {
		list.push({
			id: value.id,
			family: value.family,
			subsets: value.subsets,
			weights: value.weights,
			styles: value.styles,
			defSubset: value.defSubset,
			variable: Boolean(value.variable),
			lastModified: value.lastModified,
			category: value.category,
			license: value.license.type,
			type: value.type,
		});
	}

	// Store the list in KV
	await env.FONTLIST.put('metadata_arr', JSON.stringify(list), {
		metadata: {
			// We need to set a custom ttl for a stale-while-revalidate strategy
			ttl: Date.now() + 1000 * 60 * 60, // 1 hour
		},
	});
	return list;
};

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
						woff2: `https://api.fontsource.org/v1/fonts/${id}/${subset}-${weight}-${style}.woff2`,
						woff: `https://api.fontsource.org/v1/fonts/${id}/${subset}-${weight}-${style}.woff`,
						ttf: `https://api.fontsource.org/v1/fonts/${id}/${subset}-${weight}-${style}.ttf`,
					},
				};
			}
		}
	}

	return variants;
};

const updateId = async (
	id: string,
	env: Env,
	ctx: ExecutionContext,
): Promise<IDResponse | undefined> => {
	const data = await getOrUpdateMetadata(env, ctx);

	if (data[id] === undefined) {
		return;
	}

	const value: IDResponse = {
		id: data[id].id,
		family: data[id].family,
		subsets: data[id].subsets,
		weights: data[id].weights,
		styles: data[id].styles,
		defSubset: data[id].defSubset,
		variable: Boolean(data[id].variable),
		lastModified: data[id].lastModified,
		category: data[id].category,
		license: data[id].license.type,
		type: data[id].type,
		unicodeRange: data[id].unicodeRange,
		variants: generateFontVariants(data[id]),
	};

	// Store the list in KV
	await env.FONTS.put(id, JSON.stringify(value), {
		metadata: {
			// We need to set a custom ttl for a stale-while-revalidate strategy
			ttl: Date.now() + 1000 * 60 * 60, // 1 hour
		},
	});
	return value;
};

export { updateArrayMetadata, updateId };
