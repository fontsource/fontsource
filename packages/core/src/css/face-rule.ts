import type { FontFace, FontSource } from '../types';
import { formatStyle } from '../utils/style';
import { normalizeKebabCase } from '../utils/text';
import { type FontFaceDeclaration, renderFontFaceRule } from './rule';

export type UrlResolver = (input: {
	face: FontFace;
	source: FontSource;
}) => string;

export interface FontFaceOptions {
	display?: string;
	resolver?: UrlResolver;
}

// Build one `src` entry per source file.
const getSourceValue = (
	face: FontFace,
	source: FontSource,
	resolver?: UrlResolver,
): string => {
	const url = resolver
		? resolver({ face, source })
		: `./files/${source.filename}`;

	if (source.format === 'woff2') {
		const format = face.isVariable ? "'woff2-variations'" : 'woff2';
		return `url(${url}) format(${format})`;
	}

	const format = source.format === 'ttf' ? 'truetype' : 'woff';
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

const renderFontFace = (
	face: FontFace,
	family: string,
	options: FontFaceOptions = {},
): string => {
	const { display = 'swap', resolver } = options;

	if (face.sources.length === 0) {
		throw new Error('renderFontFace requires at least one source');
	}

	// Keep variable and static families distinct without appending the suffix twice.
	const familyName =
		face.isVariable && !family.endsWith(' Variable')
			? `${family} Variable`
			: family;
	const declarations: FontFaceDeclaration[] = [
		['font-family', `'${familyName}'`],
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

	return renderFontFaceRule(declarations, {
		comment: getFaceComment(family, face),
	});
};

export { renderFontFace };
