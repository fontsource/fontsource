import type { ObservableObject } from '@legendapp/state';

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
const createFontVariation = (axes: Record<string, number | undefined>) =>
	Object.entries(axes)
		.flatMap(([key, value]) =>
			value === undefined ? [] : [`"${key}" ${value}`],
		)
		.join(', ');

export { createFontVariation, type FontIDObject, type FontIDState };
