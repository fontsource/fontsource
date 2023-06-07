import useFontFaceObserver from 'use-font-face-observer';

export const useIsFontLoaded = (family: string, weights?: number[]) => {
	const isFontLoaded = useFontFaceObserver(
		[
			{
				family,
			},
		],
		{ timeout: 15_000 }
	);
	if (!weights || weights.length === 0) return isFontLoaded;

	const loadingArray = weights.map((weight) => {
		// Loop loading order is guaranteed to be consistent, so we can disable the rule
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useFontFaceObserver(
			[
				{
					family,
					// @ts-expect-error - weight is a number, but the type definition is wrong
					weight: String(weight),
				},
			],
			{ timeout: 15_000 }
		);
	});
	const getFontLoaded = loadingArray.every(Boolean);

	return getFontLoaded;
};
