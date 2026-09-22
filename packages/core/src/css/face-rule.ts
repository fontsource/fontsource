import type { FontFace, FontSource } from '../types';

/** Validated face data. The renderer escapes CSS syntax; callers own metadata validation. */
export interface CSSFontFace {
	family: string;
	style: string;
	weight: number | string;
	isVariable?: boolean;
	stretch?: string | null;
	/** null deliberately omits the descriptor for an unrestricted face. */
	unicodeRange: string | null;
	sources: readonly {
		/** Trusted URL, already safe for unquoted CSS url(). */
		url: string;
		format: 'woff' | 'woff2' | 'truetype' | 'opentype' | 'woff2-variations';
	}[];
}

export interface CSSOptions {
	display?: string;
	minify?: boolean;
	resolver?: UrlResolver;
}

export type UrlResolver = (input: {
	face: FontFace;
	source: FontSource;
}) => string;

// Escape single-quoted CSS strings; metadata validation belongs to callers.
const quote = (value: string): string =>
	`'${value
		.replaceAll('\\', '\\\\')
		.replaceAll("'", "\\'")
		.replaceAll('\n', '\\a ')
		.replaceAll('\r', '\\d ')
		.replaceAll('\f', '\\c ')}'`;

/** Render one face in the same canonical form for packages, CDN responses and previews. */
export const renderFontFaceRule = (
	face: CSSFontFace,
	{
		display = 'swap',
		minify = false,
	}: Pick<CSSOptions, 'display' | 'minify'> = {},
): string => {
	if (face.sources.length === 0) {
		throw new Error('renderFontFace requires at least one source');
	}

	const family =
		face.isVariable && !face.family.endsWith(' Variable')
			? `${face.family} Variable`
			: face.family;
	const space = minify ? '' : ' ';
	const declarations = [
		// Quoting preserves names containing punctuation, digits or CSS keywords.
		`font-family:${space}${quote(family)};`,
		`font-style:${space}${face.style};`,
		`font-display:${space}${display};`,
		`font-weight:${space}${face.weight};`,
	];
	if (face.stretch) declarations.push(`font-stretch:${space}${face.stretch};`);

	const sources = face.sources.map(({ url, format }) => {
		// Legacy hints such as 'woff2-variations' require string syntax.
		const sourceFormat =
			format === 'woff2-variations' ? "'woff2-variations'" : format;
		return `url(${url}) format(${sourceFormat})`;
	});
	declarations.push(`src:${space}${sources.join(`,${space}`)};`);
	if (face.unicodeRange) {
		declarations.push(`unicode-range:${space}${face.unicodeRange};`);
	}

	return minify
		? `@font-face{${declarations.join('')}}`
		: `@font-face {\n  ${declarations.join('\n  ')}\n}`;
};

/** Adapt build faces without inferring additional variants or filenames. */
export const renderFontFace = (
	face: FontFace,
	family: string,
	options: CSSOptions = {},
): string =>
	renderFontFaceRule(
		{
			family,
			style: face.style,
			weight: face.weight,
			isVariable: face.isVariable,
			stretch: face.stretch,
			unicodeRange: face.unicodeRange === '' ? null : face.unicodeRange,
			sources: face.sources.map((source) => ({
				url: options.resolver
					? options.resolver({ face, source })
					: `./files/${source.filename}`,
				format:
					source.format === 'ttf'
						? 'truetype'
						: source.format === 'woff2' && face.isVariable
							? 'woff2-variations'
							: source.format,
			})),
		},
		options,
	);
