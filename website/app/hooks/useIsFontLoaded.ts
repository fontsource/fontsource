// @ts-expect-error - The type definition is wrong
import useFontFaceObserver from 'use-font-face-observer';

interface ObserverOptions {
	weights?: number[];
	style?: string;
}

export const useIsFontLoaded = (family: string, options?: ObserverOptions) => {
	if (!options?.weights || options.weights.length === 0)
		return useFontFaceObserver(
			[{ family, style: options?.style ?? 'normal' }],
			{
				timeout: 15_000,
			},
		);

	const loadingArray = options?.weights.map((weight) => {
		// Loop loading order is guaranteed to be consistent, so we can disable the rule
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useFontFaceObserver(
			[
				{
					family,
					weight: String(weight),
					style: options.style ?? 'normal',
				},
			],
			{ timeout: 15_000 },
		);
	});
	const getFontLoaded = loadingArray.every(Boolean);

	return getFontLoaded;
};
