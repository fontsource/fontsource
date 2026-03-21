import type { FontFace, FontSource } from '../types';
import { normalizeKebabCase } from '../utils';

export type UrlResolver = (input: {
	face: FontFace;
	source: FontSource;
}) => string;

export type CssDeclarationValue = string | string[];

export interface FontFaceRule {
	comment?: string;
	declarations: Array<readonly [property: string, value: CssDeclarationValue]>;
}

export interface FaceRuleBuildOptions {
	display?: string;
	resolver?: UrlResolver;
}

const declarationIndent = '  ';

// Match Fontsource's variable family naming.
const getResolvedFamilyName = (family: string, isVariable: boolean): string =>
	isVariable && !family.endsWith(' Variable') ? `${family} Variable` : family;

const getSourceFormat = (source: FontSource, isVariable: boolean): string => {
	if (source.format === 'woff2') {
		return isVariable ? 'woff2-variations' : 'woff2';
	}

	if (source.format === 'ttf') {
		return 'truetype';
	}

	return 'woff';
};

// Build one `src` entry per source file.
const getSourceValue = (
	face: FontFace,
	source: FontSource,
	resolver?: UrlResolver,
): string => {
	const url = resolver
		? resolver({ face, source })
		: `./files/${source.filename}`;

	const format = getSourceFormat(source, face.isVariable);
	return `url(${url}) format('${format}')`;
};

const getFaceComment = (family: string, face: FontFace): string => {
	const normalizedStyle = face.style.startsWith('oblique')
		? 'italic'
		: face.style;

	let comment = `${normalizeKebabCase(family)}-${face.subset}-${face.axisKey ?? face.weight}-${normalizedStyle}`;

	if (face.sliceIndex > 0) {
		comment += `-${face.sliceIndex}`;
	}

	return comment;
};

const buildFontFaceRule = (
	face: FontFace,
	family: string,
	options: FaceRuleBuildOptions = {},
): FontFaceRule => {
	const { display = 'swap', resolver } = options;

	if (face.sources.length === 0) {
		throw new Error('generateFontFace requires at least one source');
	}

	const declarations: FontFaceRule['declarations'] = [
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

	return {
		comment: getFaceComment(family, face),
		declarations,
	};
};

const renderDeclarationValue = (
	property: string,
	value: CssDeclarationValue,
): string => {
	if (!Array.isArray(value)) {
		return `${declarationIndent}${property}: ${value};`;
	}

	const continuationIndent = ' '.repeat(
		`${declarationIndent + property}: `.length,
	);

	return `${declarationIndent}${property}: ${value.join(`,\n${continuationIndent}`)};`;
};

const renderFontFaceRule = (rule: FontFaceRule): string => {
	const comment = rule.comment ? `/* ${rule.comment} */\n` : '';
	const declarations = rule.declarations
		.map(([property, value]) => renderDeclarationValue(property, value))
		.join('\n');

	return `${comment}@font-face {\n${declarations}\n}`;
};

export {
	getFaceComment,
	getSourceFormat,
	buildFontFaceRule,
	renderFontFaceRule,
};
