interface FontPreviewSelection {
	format: 'variable' | 'static';
	subset: string;
	style: 'normal' | 'italic';
	weight: number;
	axes: Record<string, number>;
}

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

export { type FontPreviewSelection, saveFontPreviewSelection };
