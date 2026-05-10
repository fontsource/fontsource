export interface LicenseData {
	type: string;
	url: string;
	attribution: string;
}

export interface AxisValue {
	default: string;
	min: string;
	max: string;
	step: string;
}

export type VariableAxes = Record<string, AxisValue>;

/**
 * Upstream subset keys may be wrapped in brackets, so callers should normalize
 * them before comparing against published asset filenames.
 */
export type UnicodeRangeMap = Record<string, string>;

interface SourceFontSummary {
	id: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	defSubset: string;
	lastModified: string;
	category: string;
	type: string;
}

export interface SourceFontMetadata extends SourceFontSummary {
	variable: false | VariableAxes;
	version: string;
	license: LicenseData;
	source: string;
	npmVersion?: string;
	unicodeRange: UnicodeRangeMap;
}

export type FontCatalog = Record<string, SourceFontMetadata>;
export type VariableCatalog = Record<string, VariableFontDetail>;

export interface FontVariantUrls {
	woff2: string;
	woff: string;
	ttf: string;
}

type FontSubsetVariants = Record<string, { url: FontVariantUrls }>;
type FontStyleVariants = Record<string, FontSubsetVariants>;
export type FontVariants = Record<string, FontStyleVariants>;

export interface FontListItem extends SourceFontSummary {
	variable: boolean;
	license: string;
}

export interface FontDetail extends FontListItem {
	version: string;
	source: string;
	npmVersion?: string;
	unicodeRange: UnicodeRangeMap;
	variants: FontVariants;
}

export interface VariableFontDetail {
	family: string;
	axes: VariableAxes;
}

export type FontListQueryKey =
	| 'family'
	| 'subsets'
	| 'weights'
	| 'styles'
	| 'variable'
	| 'lastModified'
	| 'category'
	| 'version'
	| 'type';

export type FontFilterQueryKey =
	| 'id'
	| 'family'
	| 'subsets'
	| 'weights'
	| 'styles'
	| 'defSubset'
	| 'variable'
	| 'lastModified'
	| 'category'
	| 'license'
	| 'type';

/**
 * Returns the union of explicit subset names and unicode-range keys.
 *
 * The legacy metadata API exposed both views, so downstream consumers expect
 * subset-driven URLs to work for either representation.
 */
export const getMetadataSubsetKeys = (
	metadata: SourceFontMetadata,
): string[] => {
	const unicodeKeys = Object.keys(metadata.unicodeRange).map((key) =>
		// Normalize upstream keys by stripping optional brackets.
		key.replace(/^\[|\]$/g, ''),
	);

	return unicodeKeys.length > 0
		? Array.from(new Set([...unicodeKeys, ...metadata.subsets]))
		: metadata.subsets;
};
