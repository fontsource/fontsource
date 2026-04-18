import type {
	FontCatalog,
	FontDetail,
	FontFilterQueryKey,
	FontListItem,
	FontListQueryKey,
	FontVariants,
	SourceFontMetadata,
	VariableCatalog,
} from '../../../../shared/catalog';
import { getMetadataSubsetKeys } from '../../../../shared/catalog';

const buildFontListItem = (metadata: SourceFontMetadata): FontListItem => ({
	id: metadata.id,
	family: metadata.family,
	subsets: metadata.subsets,
	weights: metadata.weights,
	styles: metadata.styles,
	defSubset: metadata.defSubset,
	variable: Boolean(metadata.variable),
	lastModified: metadata.lastModified,
	category: metadata.category,
	license: metadata.license.type,
	type: metadata.type,
});

/**
 * Builds the full font detail response, including the three-level variant map
 * (weight → style → subset) with CDN URLs for each format.
 *
 * The `buildUrl` callback is injected by the caller so the URL shape can vary
 * between the metadata API (latest tag) and any future uses.
 */
export const buildFontDetail = (
	metadata: SourceFontMetadata,
	buildUrl: (input: {
		id: string;
		subset: string;
		weight: number;
		style: string;
		extension: 'woff2' | 'woff' | 'ttf';
	}) => string,
): FontDetail => {
	const variants: FontVariants = {};

	for (const weight of metadata.weights) {
		variants[String(weight)] = variants[String(weight)] ?? {};

		for (const style of metadata.styles) {
			variants[String(weight)][style] = variants[String(weight)][style] ?? {};

			for (const subset of getMetadataSubsetKeys(metadata)) {
				variants[String(weight)][style][subset] = {
					url: {
						woff2: buildUrl({
							id: metadata.id,
							subset,
							weight,
							style,
							extension: 'woff2',
						}),
						woff: buildUrl({
							id: metadata.id,
							subset,
							weight,
							style,
							extension: 'woff',
						}),
						ttf: buildUrl({
							id: metadata.id,
							subset,
							weight,
							style,
							extension: 'ttf',
						}),
					},
				};
			}
		}
	}

	return {
		...buildFontListItem(metadata),
		unicodeRange: metadata.unicodeRange,
		variants,
	};
};

/** Flattens the full catalog into an array of summary items for the list endpoint. */
export const buildFontIndex = (catalog: FontCatalog): FontListItem[] =>
	Object.values(catalog).map(buildFontListItem);

/**
 * Applies the legacy `/v1/fonts` filter semantics to the flattened index.
 */
export const filterFontIndex = (
	items: readonly FontListItem[],
	queries: Partial<Record<FontFilterQueryKey, string>>,
): FontListItem[] =>
	items.filter((item) =>
		Object.entries(queries).every(([key, rawValue]) => {
			if (!rawValue) {
				return true;
			}

			const values = rawValue.split(',');
			switch (key as FontFilterQueryKey) {
				case 'subsets':
				case 'styles':
					return values.some((value) =>
						item[key as 'subsets' | 'styles'].includes(value),
					);
				case 'weights':
					return values.some((value) => item.weights.includes(Number(value)));
				case 'variable':
					return values.includes(String(item.variable));
				default:
					return values.includes(String(item[key as keyof FontListItem]));
			}
		}),
	);

/**
 * Projects one field from the catalog into a flat `{ id → value }` map.
 *
 * This is the legacy `/fontlist` response shape: a single field across every
 * family so clients can build lookup tables without fetching the full catalog.
 */
export const buildFontlist = (
	catalog: FontCatalog,
	key: FontListQueryKey = 'type',
): Record<string, string | string[] | number[] | boolean> => {
	const list: Record<string, string | string[] | number[] | boolean> = {};

	for (const metadata of Object.values(catalog)) {
		list[metadata.id] =
			key === 'variable'
				? Boolean(metadata.variable)
				: (metadata[key] as string | string[] | number[]);
	}

	return list;
};

/** Filters the catalog down to variable-only families with their axis definitions. */
export const buildVariableIndex = (catalog: FontCatalog): VariableCatalog =>
	Object.values(catalog).reduce<VariableCatalog>((accumulator, metadata) => {
		if (metadata.variable) {
			accumulator[metadata.id] = {
				family: metadata.family,
				axes: metadata.variable,
			};
		}

		return accumulator;
	}, {});
