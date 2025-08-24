import FontFaceObserver from 'fontfaceobserver';
import { useEffect, useMemo, useState } from 'react';

interface ObserverOptions {
	weights?: number[];
	style?: string;
}

interface FontFace {
	family: string;
	weight?: number;
	style?: string;
}

export const useIsFontLoaded = (family: string, options?: ObserverOptions) => {
	const [isResolved, setIsResolved] = useState(false);

	// Memoize the font faces array to avoid unnecessary re-renders.
	const fontFaces = useMemo(() => {
		if (!options?.weights || options.weights.length === 0) {
			return [{ family, style: options?.style ?? 'normal' }];
		}

		return options.weights.map((weight) => ({
			family,
			weight,
			style: options.style ?? 'normal',
		}));
	}, [family, options?.weights, options?.style]);

	useEffect(() => {
		setIsResolved(false);

		const promises = fontFaces.map(
			async ({ family, weight, style }: FontFace) => {
				await new FontFaceObserver(family, {
					weight,
					style,
				}).load(undefined, 15_000);
			},
		);

		Promise.all(promises)
			.then(() => {
				setIsResolved(true);
			})
			.catch(() => {
				// Font loading failed, but we don't want to throw
				// Just leave isResolved as false
			});
	}, [fontFaces]);

	return isResolved;
};
