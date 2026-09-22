import {
	type FontFaceDeclaration,
	renderFontFaceRule,
} from '@fontsource-utils/core/css';

interface Axes {
	min: number | string;
	max: number | string;
}

interface FontObject {
	family: string;
	style: string;
	display: string;
	weight: number;
	src: { url: string; format: string }[];
	variable?: { wght?: Axes; stretch?: Axes; slnt?: Axes };
	unicodeRange?: string;
	comment?: string;
}

const generateFontFace = (font: FontObject) => {
	const {
		family,
		style,
		display,
		weight,
		variable,
		src,
		unicodeRange,
		comment,
	} = font;
	// Preserve the legacy CLI axis formatting.
	const { wght, stretch, slnt } = variable ?? {};
	let fontWeight = `${weight}`;
	if (wght) {
		fontWeight =
			wght.min === wght.max ? `${wght.min}` : `${wght.min} ${wght.max}`;
	}

	const declarations: FontFaceDeclaration[] = [
		['font-family', `'${family}'`],
		[
			'font-style',
			slnt
				? `oblique ${Number(slnt.max) * -1}deg ${Number(slnt.min) * -1}deg`
				: style,
		],
		['font-display', display],
		['font-weight', fontWeight],
	];

	if (stretch)
		declarations.push(['font-stretch', `${stretch.min}% ${stretch.max}%`]);

	// Merges all formats into a single src
	declarations.push([
		'src',
		src.map(({ url, format }) => `url(${url}) format('${format}')`).join(', '),
	]);

	if (unicodeRange) declarations.push(['unicode-range', unicodeRange]);

	return renderFontFaceRule(declarations, { comment });
};

export type { FontObject };
export { generateFontFace };
