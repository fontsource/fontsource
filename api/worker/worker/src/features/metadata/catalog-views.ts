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
import { UPSTREAM_URLS } from '../../constants';

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

/** Builds the full font detail response, including its nested variant map. */
export const buildFontDetail = (metadata: SourceFontMetadata): FontDetail => {
	const variants: FontVariants = {};

	for (const weight of metadata.weights) {
		variants[String(weight)] = variants[String(weight)] ?? {};

		for (const style of metadata.styles) {
			variants[String(weight)][style] = variants[String(weight)][style] ?? {};

			for (const subset of getMetadataSubsetKeys(metadata)) {
				const url = `${UPSTREAM_URLS.publicCdn}/fonts/${metadata.id}@latest/${subset}-${weight}-${style}`;
				variants[String(weight)][style][subset] = {
					url: {
						woff2: `${url}.woff2`,
						woff: `${url}.woff`,
						ttf: `${url}.ttf`,
					},
				};
			}
		}
	}

	return {
		...buildFontListItem(metadata),
		version: metadata.version,
		source: metadata.source,
		...(metadata.npmVersion ? { npmVersion: metadata.npmVersion } : {}),
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
	key: FontFilterQueryKey,
	rawValue: string,
): FontListItem[] =>
	items.filter((item) => {
		if (!rawValue) {
			return true;
		}

		const values = rawValue.split(',');
		switch (key) {
			case 'subsets':
			case 'styles':
				return values.some((value) => item[key].includes(value));
			case 'weights':
				return values.some((value) => item.weights.includes(Number(value)));
			case 'variable':
				return values.includes(String(item.variable));
			default:
				return values.includes(String(item[key]));
		}
	});

/**
 * Projects one field from the catalog into a flat record keyed by font ID.
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
