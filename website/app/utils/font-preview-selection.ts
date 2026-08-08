import { z } from 'zod';

const fontPreviewSelectionSchema = z.object({
	format: z.enum(['variable', 'static']),
	subset: z.string(),
	style: z.enum(['normal', 'italic']),
	weight: z.number(),
	axes: z.record(z.string(), z.number().finite()),
});

type FontPreviewSelection = z.infer<typeof fontPreviewSelectionSchema>;

const getStorageKey = (familyId: string) =>
	`fontsource.preview-selection.${familyId}`;

const saveFontPreviewSelection = (
	familyId: string,
	selection: FontPreviewSelection,
) => {
	if (typeof window === 'undefined') return false;

	try {
		window.sessionStorage.setItem(
			getStorageKey(familyId),
			JSON.stringify(selection),
		);
		return true;
	} catch {
		return false;
	}
};

const readFontPreviewSelection = (
	familyId: string,
): FontPreviewSelection | undefined => {
	if (typeof window === 'undefined') return;

	try {
		const value = window.sessionStorage.getItem(getStorageKey(familyId));
		if (!value) return;
		return fontPreviewSelectionSchema.parse(JSON.parse(value));
	} catch {
		return;
	}
};

export {
	type FontPreviewSelection,
	readFontPreviewSelection,
	saveFontPreviewSelection,
};
