import type { FontFace, FontSource } from '../types';
import { formatStyle, normalizeKebabCase } from '../utils';

export type UrlResolver = (input: {
	face: FontFace;
	source: FontSource;
}) => string;

export interface FontFaceOptions {
	display?: string;
	resolver?: UrlResolver;
}

const declarationIndent = '  ';
type CSSValue = string | string[];

// Build one `src` entry per source file.
const getSourceValue = (
	face: FontFace,
	source: FontSource,
	resolver?: UrlResolver,
): string => {
	const url = resolver
		? resolver({ face, source })
		: `./files/${source.filename}`;

	let format = 'woff';
	if (source.format === 'woff2') {
		// Special format to make it clear to browsers that this is a variable font.
		format = face.isVariable ? 'woff2-variations' : 'woff2';
	} else if (source.format === 'ttf') {
		format = 'truetype';
	}

	return `url(${url}) format('${format}')`;
};

const getFaceComment = (family: string, face: FontFace): string => {
	const axisOrWeight =
		typeof face.axisKey === 'string' ? face.axisKey.toLowerCase() : face.weight;

	let comment = `${normalizeKebabCase(family)}-${face.subset}-${axisOrWeight}-${formatStyle(face.style)}`;

	if (face.sliceIndex > 0) {
		comment += `-${face.sliceIndex}`;
	}

	return comment;
};

// Variable fonts get a "Variable" suffix in their family name to avoid conflicts with static faces.
// We need it when variable fonts are included and static files are present as a fallback.
const getResolvedFamilyName = (family: string, isVariable: boolean): string =>
	isVariable && !family.endsWith(' Variable') ? `${family} Variable` : family;

const renderDeclaration = (property: string, value: CSSValue): string => {
	if (!Array.isArray(value)) {
		return `${declarationIndent}${property}: ${value};`;
	}

	const continuationIndent = ' '.repeat(
		`${declarationIndent + property}: `.length,
	);

	return `${declarationIndent}${property}: ${value.join(`,\n${continuationIndent}`)};`;
};

const renderFontFace = (
	face: FontFace,
	family: string,
	options: FontFaceOptions = {},
): string => {
	const { display = 'swap', resolver } = options;

	if (face.sources.length === 0) {
		throw new Error('renderFontFace requires at least one source');
	}

	const declarations: Array<readonly [property: string, value: CSSValue]> = [
		['font-family', `'${getResolvedFamilyName(family, face.isVariable)}'`],
		['font-style', face.style],
		['font-display', display],
		['font-weight', `${face.weight}`],
	];

	if (face.stretch) {
		declarations.push(['font-stretch', face.stretch]);
	}

	// Multiple files for one face stay in one rule.
	declarations.push([
		'src',
		face.sources.map((source) => getSourceValue(face, source, resolver)),
	]);

	if (face.unicodeRange) {
		declarations.push(['unicode-range', face.unicodeRange]);
	}

	const comment = getFaceComment(family, face);
	const content = declarations
		.map(([property, value]) => renderDeclaration(property, value))
		.join('\n');

	return `${comment ? `/* ${comment} */\n` : ''}@font-face {\n${content}\n}`;
};

export { renderFontFace };
