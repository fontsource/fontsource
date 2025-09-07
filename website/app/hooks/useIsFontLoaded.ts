import { useEffect, useMemo, useSyncExternalStore } from 'react';

type FontStatus = 'loading' | 'loaded' | 'failed' | undefined;

interface FontFace {
	family: string;
	weight?: number | string;
	style?: string;
}

interface ObserverOptions {
	weights?: number[];
	style?: string;
}

const fontStatusCache = new Map<string, FontStatus>();
const subscribers = new Map<string, Set<() => void>>();

const isClient = typeof window !== 'undefined';

const loadFont = async (
	{ family, weight = 'normal', style = 'normal' }: FontFace,
	text = 'BESbswy', // Default text to test font loading.
	timeout = 15_000,
) => {
	// e.g., "italic 700 100px 'Roboto'"
	const fontShorthand = `${style} ${weight} 100px "${family}"`;

	// We check for `document.fonts` to prevent errors in non-browser environments (like SSR).
	if (!isClient || !document?.fonts) {
		// Resolve immediately on the server or in unsupported environments.
		console.warn('Font Loading API not supported. Skipping font load.');
		return Promise.resolve();
	}

	let timeoutId: number | undefined;

	const loaderPromise = document.fonts
		.load(fontShorthand, text)
		.then((fonts) => {
			if (fonts.length === 0) {
				throw new Error(`Font '${family}' failed to load or was not found.`);
			}
		});

	const timeoutPromise = new Promise((_, reject) => {
		if (isClient) {
			timeoutId = window.setTimeout(() => {
				reject(new Error(`Font '${family}' timed out after ${timeout}ms.`));
			}, timeout);
		} else {
			// On server, immediately reject to avoid hanging promises.
			reject();
		}
	});

	try {
		return await Promise.race([loaderPromise, timeoutPromise]);
	} finally {
		// Cleanup to prevent memory leaks.
		if (timeoutId && isClient) {
			window.clearTimeout(timeoutId);
		}
	}
};

const notify = (cacheKey: string) => {
	for (const callback of subscribers.get(cacheKey) ?? []) {
		callback();
	}
};

const triggerFontLoad = (cacheKey: string, fontFaces: FontFace[]) => {
	if (fontStatusCache.has(cacheKey)) {
		return; // Already loading or loaded.
	}

	fontStatusCache.set(cacheKey, 'loading');

	// Initial notification for the 'loading' state.
	notify(cacheKey);

	const promises = fontFaces.map((font) => loadFont(font));

	Promise.all(promises)
		.then(() => {
			fontStatusCache.set(cacheKey, 'loaded');
		})
		.catch((error) => {
			fontStatusCache.set(cacheKey, 'failed');
			console.warn(`Failed to load font set: ${cacheKey}`, error);
		})
		.finally(() => {
			// Final notification for 'loaded' or 'failed' state.
			notify(cacheKey);
		});
};

export const useFontStatus = (
	family: string,
	enabled = true,
	options?: ObserverOptions,
): FontStatus => {
	const fontFaces = useMemo<FontFace[]>(() => {
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
		// Skip font loading during SSR or if the hook is not enabled.
		if (!isClient || !enabled) {
			return;
		}

		triggerFontLoad(cacheKey, fontFaces);
	}, [cacheKey, fontFaces, enabled]);

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

	// If not enabled, the font is neither loading nor loaded yet.
	if (!enabled) {
		return undefined;
	}

	return status;
};

export const useIsFontLoaded = (
	family: string,
	enabled = true,
	options?: ObserverOptions,
) => {
	return useFontStatus(family, enabled, options) === 'loaded';
};
