import { type ObservableObject } from '@legendapp/state';

interface FontIDObject {
	preview: {
		language: string;
		size: number;
		italic: boolean;
		lineHeight: number;
		letterSpacing: number;
		transparency: number;
		color: string;
		text: string;
	};
	variable: Record<string, number | undefined>;
	fontVariation: string;
}

type FontIDState = ObservableObject<FontIDObject>;

// Generate font-variation-settings string from axes object e.g. "wght" 400, "wdth" 100
const createFontVariation = (axes: Record<string, number | undefined>) => {
	let fontVariation = '';
	for (const [key, value] of Object.entries(axes)) {
		if (value !== undefined) fontVariation += `"${key}" ${value}, `;
	}
	// Remove trailing comma and space
	return fontVariation.slice(0, -2);
};


export { createFontVariation, type FontIDObject, type FontIDState };
