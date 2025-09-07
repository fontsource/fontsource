import FontFaceObserver from 'fontfaceobserver';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

type FontStatus = 'loading' | 'loaded' | 'failed' | undefined;
type FontFace = { family: string; weight?: number; style?: string };

interface ObserverOptions {
	weights?: number[];
	style?: string;
}

// Global cache for font tracking.
const fontStatusCache = new Map<string, FontStatus>();
const subscribers = new Map<string, Set<() => void>>();

const notify = (cacheKey: string) => {
	for (const callback of subscribers.get(cacheKey) ?? []) {
		callback();
	}
};

const loadFont = (cacheKey: string, fontFaces: FontFace[]) => {
	if (fontStatusCache.has(cacheKey)) {
		return; // Already loading or loaded.
	}

	fontStatusCache.set(cacheKey, 'loading');

	// Initial notification for the 'loading' state
	notify(cacheKey);

	const promises = fontFaces.map(async ({ family, weight, style }) =>
		new FontFaceObserver(family, { weight, style }).load(undefined, 15_000),
	);

	Promise.all(promises)
		.then(() => {
			fontStatusCache.set(cacheKey, 'loaded');
		})
		.catch(() => {
			fontStatusCache.set(cacheKey, 'failed');
			console.warn(`Failed to load font: ${cacheKey}`);
		})
		.finally(() => {
			// Final notification for 'loaded' or 'failed' state.
			notify(cacheKey);
		});
};

// It's better to return the full status, not just a boolean.
export const useFontStatus = (
	family: string,
	options?: ObserverOptions,
): FontStatus => {
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

	const cacheKey = useMemo(() => JSON.stringify(fontFaces), [fontFaces]);

	// Load the font on mount or when font faces change.
	useEffect(() => {
		loadFont(cacheKey, fontFaces);
	}, [cacheKey, fontFaces]);

	const status = useSyncExternalStore(
		(callback) => {
			if (!subscribers.has(cacheKey)) {
				subscribers.set(cacheKey, new Set());
			}

			// biome-ignore lint/style/noNonNullAssertion: We check existence with .has().
			const specificSubscribers = subscribers.get(cacheKey)!;

			specificSubscribers.add(callback);

			return () => {
				specificSubscribers.delete(callback);

				// Clean up if no subscribers left.
				if (specificSubscribers.size === 0) {
					subscribers.delete(cacheKey);
				}
			};
		},
		() => fontStatusCache.get(cacheKey), // Client snapshot.
		() => undefined, // Server snapshot should always be undefined (no fonts loaded on server).
	);

	return status;
};

export const useIsFontLoaded = (family: string, options?: ObserverOptions) => {
	return useFontStatus(family, options) === 'loaded';
};
