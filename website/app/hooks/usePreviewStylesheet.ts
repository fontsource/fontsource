import { useEffect, useState } from 'react';
import { preinit } from 'react-dom';
import invariant from 'tiny-invariant';

export const usePreviewStylesheet = (
	stylesheetHref: string,
	enabled: boolean,
) => {
	const [shouldLoadStylesheet, setShouldLoadStylesheet] = useState(enabled);
	const [isStylesheetReady, setStylesheetReady] = useState(false);

	useEffect(() => {
		// Keep loading enabled when a card leaves the viewport mid-request.
		if (enabled) {
			setShouldLoadStylesheet(true);
		}
	}, [enabled]);

	useEffect(() => {
		if (!shouldLoadStylesheet) return;

		// React retains and deduplicates the stylesheet across virtualized cards.
		preinit(stylesheetHref, { as: 'style', precedence: 'font-preview' });
		const stylesheet = document.querySelector<HTMLLinkElement>(
			`link[rel="stylesheet"][href="${CSS.escape(stylesheetHref)}"]`,
		);
		invariant(stylesheet, 'Missing preview stylesheet');
		let active = true;
		const ready = () => {
			stylesheet.dataset.fontPreviewReady = 'true';
			stylesheet.removeEventListener('load', ready);
			stylesheet.removeEventListener('error', ready);
			if (active) setStylesheetReady(true);
		};
		if (stylesheet.sheet || stylesheet.dataset.fontPreviewReady) {
			ready();
			return;
		}
		stylesheet.addEventListener('load', ready);
		stylesheet.addEventListener('error', ready);
		return () => {
			// Remember failures even if this card unmounts before the request settles.
			active = false;
		};
	}, [shouldLoadStylesheet, stylesheetHref]);

	return isStylesheetReady;
};
