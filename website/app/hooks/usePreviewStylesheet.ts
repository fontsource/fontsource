import { useEffect, useState } from 'react';
import { preinit } from 'react-dom';
import invariant from 'tiny-invariant';

export const usePreviewStylesheet = (
	stylesheetHref: string,
	enabled: boolean,
) => {
	const [shouldLoadStylesheet, setShouldLoadStylesheet] = useState(enabled);
	const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(
		'loading',
	);

	useEffect(() => {
		// Keep loading enabled when a card leaves the viewport mid-request.
		if (enabled) {
			setShouldLoadStylesheet(true);
		}
	}, [enabled]);

	useEffect(() => {
		if (!shouldLoadStylesheet) return;
		setStatus('loading');

		// React retains and deduplicates the stylesheet across virtualized cards.
		preinit(stylesheetHref, { as: 'style', precedence: 'font-preview' });
		const stylesheet = document.querySelector<HTMLLinkElement>(
			`link[rel="stylesheet"][href="${CSS.escape(stylesheetHref)}"]`,
		);
		invariant(stylesheet, 'Missing preview stylesheet');
		let active = true;
		let timeoutId: number | undefined;
		const finish = (nextStatus: 'loaded' | 'failed') => {
			stylesheet.dataset.fontPreviewStatus = nextStatus;
			window.clearTimeout(timeoutId);
			stylesheet.removeEventListener('load', loaded);
			stylesheet.removeEventListener('error', failed);
			if (active) setStatus(nextStatus);
		};
		const loaded = () => finish('loaded');
		const failed = () => finish('failed');
		if (stylesheet.sheet || stylesheet.dataset.fontPreviewStatus === 'loaded') {
			loaded();
			return;
		}
		if (stylesheet.dataset.fontPreviewStatus === 'failed') {
			failed();
			return;
		}
		stylesheet.addEventListener('load', loaded);
		stylesheet.addEventListener('error', failed);
		timeoutId = window.setTimeout(() => {
			// A slow stylesheet may still finish and recover without a reload.
			if (active) setStatus('failed');
		}, 15_000);
		return () => {
			// Retain the result across virtualized cards, even if this one unmounts.
			active = false;
			window.clearTimeout(timeoutId);
		};
	}, [shouldLoadStylesheet, stylesheetHref]);

	return status;
};
