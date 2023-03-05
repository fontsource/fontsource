import useFontFaceObserver from 'use-font-face-observer';

export const useFontLoaded = (family: string, weights: number[]) => {
	const loadingArray = weights.map((weight) => {
		// Loop loading order is guaranteed to be consistent, so we can disable the rule
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useFontFaceObserver(
			[
				{
					family,
					// @ts-ignore - weight is a number, but the type definition is wrong
					weight: String(weight),
				},
			],
			{ timeout: 7500 }
		);
	});
	const getFontLoaded = loadingArray.every((item) => item);

	return getFontLoaded;
};

