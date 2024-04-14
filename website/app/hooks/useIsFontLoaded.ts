import FontFaceObserver from 'fontfaceobserver';
import { useEffect, useState } from 'react';

interface ObserverOptions {
	weights?: number[];
	style?: string;
}

interface FontFace {
	family: string;
	weight?: number;
	style?: string;
}

interface Options {
	timeout?: number;
}

const useFontFaceObserver = (
	fontFaces: FontFace[] = [],
	{ timeout }: Options = {},
): boolean => {
	const [isResolved, setIsResolved] = useState(false);
	const fontFacesString = JSON.stringify(fontFaces);

	useEffect(() => {
		const promises = JSON.parse(fontFacesString).map(
			async ({ family, weight, style }: FontFace) => {
				await new FontFaceObserver(family, {
					weight,
					style,
				}).load(undefined, timeout);
			},
		);

		Promise.all(promises).then(() => {
			setIsResolved(true);
		});
	}, [fontFacesString, timeout]);

	return isResolved;
};

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
					weight,
					style: options.style ?? 'normal',
				},
			],
			{ timeout: 15_000 },
		);
	});
	const getFontLoaded = loadingArray.every(Boolean);

	return getFontLoaded;
};
