import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import { loadPreviewStylesheet } from '@/utils/preview-stylesheet';

type PreviewStatus = 'loading' | 'ready' | 'stylesheet-error';
const defaultWeights = [400];

interface FontPreviewOptions {
	family: string;
	text?: string;
	stylesheetHref?: string;
	enabled?: boolean;
	weights?: number[];
	style?: string;
}

export const useFontPreview = ({
	family,
	text = 'BESbswy',
	stylesheetHref,
	enabled = true,
	weights = defaultWeights,
	style = 'normal',
}: FontPreviewOptions): PreviewStatus => {
	const fonts = useMemo(
		() =>
			(weights.length ? weights : defaultWeights).map(
				(weight) => `${style} ${weight} 100px ${JSON.stringify(family)}`,
			),
		[family, weights, style],
	);
	const key = JSON.stringify([fonts, stylesheetHref]);
	const [result, setResult] = useState<{
		key: string;
		status: PreviewStatus;
	}>();
	// Once requested, finish loading even if the card leaves the viewport.
	const [shouldLoad, setShouldLoad] = useState(enabled);
	if (enabled && !shouldLoad) setShouldLoad(true);

	// Read the latest text when CSS arrives without restarting the load on edits.
	const onStylesheetLoaded = useEffectEvent(() =>
		Promise.all(fonts.map((font) => document.fonts.load(font, text))),
	);

	useEffect(() => {
		if (!shouldLoad) return;
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const settle = (status: PreviewStatus) => {
			if (!cancelled) {
				setResult((previous) =>
					previous?.key === key && previous.status === status
						? previous
						: { key, status },
				);
			}
		};
		const load = async () => {
			if (stylesheetHref) {
				timer = setTimeout(() => settle('stylesheet-error'), 15_000);
				try {
					// Keep observing a slow stylesheet so it can recover after timeout.
					await loadPreviewStylesheet(stylesheetHref);
				} catch {
					settle('stylesheet-error');
					return;
				} finally {
					clearTimeout(timer);
				}
			}
			if (cancelled) return;
			// Font errors and timeouts reveal fallback text instead of hiding it.
			timer = setTimeout(() => settle('ready'), 15_000);
			try {
				await onStylesheetLoaded();
			} catch (error) {
				if (!cancelled) console.warn('Failed to load font preview:', error);
			} finally {
				clearTimeout(timer);
			}
			settle('ready');
		};
		void load();
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [shouldLoad, key, stylesheetHref]);

	// Once visible, CSS handles subset loading as the preview text changes.
	return result?.key === key ? result.status : 'loading';
};
