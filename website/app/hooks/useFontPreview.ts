import { useEffect, useMemo, useState } from 'react';

type PreviewStatus = 'loading' | 'ready' | 'stylesheet-error';
const stylesheets = new Map<string, Promise<void>>();
const defaultWeights = [400];

const loadStylesheet = (href: string) => {
	let promise = stylesheets.get(href);
	if (!promise) {
		promise = new Promise<void>((resolve, reject) => {
			const existing = Array.from(
				document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
			).find((link) => link.href === href);
			if (existing?.sheet) return resolve();
			const link = existing ?? document.createElement('link');
			const loaded = () => {
				cleanup();
				resolve();
			};
			const failed = () => {
				cleanup();
				reject(new Error(`Stylesheet failed to load: ${href}`));
			};
			const cleanup = () => {
				link.removeEventListener('load', loaded);
				link.removeEventListener('error', failed);
			};
			link.addEventListener('load', loaded);
			link.addEventListener('error', failed);
			if (!existing) {
				link.rel = 'stylesheet';
				link.href = href;
				document.head.appendChild(link);
			}
		});
		stylesheets.set(href, promise);
	}
	return promise;
};

const withTimeout = async (promise: Promise<unknown>) => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(
					() => reject(new Error('Font preview timed out')),
					15_000,
				);
			}),
		]);
	} finally {
		clearTimeout(timer);
	}
};

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
	// Editing an already visible preview should not flash the skeleton.
	const key = JSON.stringify([fonts, stylesheetHref]);
	const [result, setResult] = useState<{
		key: string;
		status: PreviewStatus;
	}>();

	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		const load = async () => {
			if (stylesheetHref) {
				const timer = setTimeout(() => {
					if (!cancelled) setResult({ key, status: 'stylesheet-error' });
				}, 15_000);
				try {
					// A slow stylesheet can still recover after showing the error.
					await loadStylesheet(stylesheetHref);
				} catch {
					if (!cancelled) setResult({ key, status: 'stylesheet-error' });
					return;
				} finally {
					clearTimeout(timer);
				}
			}
			if (cancelled) return;
			try {
				if (document.fonts) {
					await withTimeout(
						Promise.all(
							fonts.map(async (font) => {
								const faces = await document.fonts.load(font, text);
								if (!faces.length) throw new Error(`Font not found: ${font}`);
							}),
						),
					);
				}
			} catch (error) {
				// Preserve fallback text when the font fails or times out.
				console.warn('Failed to load font preview:', error);
			}
			if (!cancelled) setResult({ key, status: 'ready' });
		};
		void load();
		// Already started requests remain available to other previews.
		return () => {
			cancelled = true;
		};
	}, [enabled, fonts, key, stylesheetHref, text]);

	return result?.key === key ? result.status : 'loading';
};
