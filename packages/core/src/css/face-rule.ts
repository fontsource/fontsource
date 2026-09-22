import type { FontFace, FontSource } from '../types';

/** A resolved CSS face. Package names, URLs and coverage are supplied by its owner. */
export interface CSSFontFace {
	family: string;
	style: string;
	weight: number | string;
	isVariable?: boolean;
	stretch?: string | null;
	/** null deliberately omits the descriptor for an unrestricted face. */
	unicodeRange: string | null;
	sources: readonly { url: string; format: string }[];
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

// CSS strings use hexadecimal escapes for control characters, quotes and backslashes.
const quote = (value: string): string =>
	// biome-ignore lint/suspicious/noControlCharactersInRegex: CSS strings must escape control characters.
	`'${value.replace(/[\0-\x1f\x7f'\\]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `)}'`;

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
	if (face.unicodeRange === undefined) {
		throw new Error('Font face coverage must be a Unicode range or null');
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
		// Published URLs are bare; custom URLs may contain spaces or delimiters.
		const sourceUrl = /[\0-\x20\x7f"'()\\]/.test(url) ? quote(url) : url;
		// Legacy hints such as 'woff2-variations' require string syntax.
		const sourceFormat =
			/^(woff2?|truetype|opentype|collection|embedded-opentype|svg)$/.test(
				format,
			)
				? format
				: quote(format);
		return `url(${sourceUrl}) format(${sourceFormat})`;
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
