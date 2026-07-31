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

const readFontPreviewSelection = (
	familyId: string,
): FontPreviewSelection | undefined => {
	if (typeof window === 'undefined') return;

	try {
		const value = window.sessionStorage.getItem(getStorageKey(familyId));
		if (!value) return;
		const parsed = JSON.parse(value) as Partial<FontPreviewSelection>;
		if (
			(parsed.format !== 'variable' && parsed.format !== 'static') ||
			typeof parsed.subset !== 'string' ||
			(parsed.style !== 'normal' && parsed.style !== 'italic') ||
			typeof parsed.weight !== 'number' ||
			!parsed.axes ||
			typeof parsed.axes !== 'object'
		) {
			return;
		}

		return {
			format: parsed.format,
			subset: parsed.subset,
			style: parsed.style,
			weight: parsed.weight,
			axes: Object.fromEntries(
				Object.entries(parsed.axes).filter(
					(entry): entry is [string, number] =>
						typeof entry[1] === 'number' && Number.isFinite(entry[1]),
				),
			),
		};
	} catch {
		return;
	}
};

export {
	type FontPreviewSelection,
	readFontPreviewSelection,
	saveFontPreviewSelection,
};
