// Insert a weight array to find the closest number given num - used for index.css gen
const findClosest = (arr: number[], num: number): number => {
	// Array of absolute values showing diff from target number
	const indexArr = arr.map(weight => Math.abs(Number(weight) - num));
	// Find smallest diff
	const min = Math.min(...indexArr);
	const closest = arr[indexArr.indexOf(min)];
	return closest;
};

// There may be a case where a font does not have a normal style
const findDefStyle = (styles: string[]) => styles.includes('normal') ? 'normal' : styles[0];

// We've got special permission from jsdelivr to bypass restrictions - https://github.com/jsdelivr/jsdelivr/issues/18279
const baseUrl = "https://cdn.jsdelivr.net/npm";
const fontURL = (fontId: string, subset: string, weight: number, style: string) => `${baseUrl}/@fontsource/${fontId}/files/${fontId}-${subset}-${weight}-${style}.woff2`;
const unicodeRangeUrl = (fontId: string) => `${baseUrl}/@fontsource/${fontId}/unicode.json`

interface UnicodeRange {
	[key: string]: string
}

const generateFontFaces = (fontName: string, fontId: string, subsets: string[], weights: number[], styles: string[]) => {
	// There is a chance the font does not have weight 400, so find closest
	const weight = findClosest(weights, 400);
	const style = findDefStyle(styles);

	const fontFaces = subsets.map(subset => new FontFace(fontName, `url(${fontURL(fontId, subset, weight, style)}) format("woff2")`, { style, weight: String(weight) }))
	return fontFaces;
}

const loadFonts = async (fontName: string, previewText: string, fontFaceSet: FontFace[]) => {
	for (const font of fontFaceSet) {
		if (!document.fonts.has(font) && document.fonts.check(fontName, previewText)) {
			await font.load();
			document.fonts.add(font);
		}
	}
}

export { generateFontFaces, loadFonts, unicodeRangeUrl }