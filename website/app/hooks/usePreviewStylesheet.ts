import { useEffect, useState } from 'react';

type StylesheetStatus = 'loading' | 'loaded' | 'failed';
interface PreviewStylesheet {
	link: HTMLLinkElement;
	status: StylesheetStatus;
}
const stylesheets = new Map<string, PreviewStylesheet>();

const loadStylesheet = (href: string) => {
	let stylesheet = stylesheets.get(href);
	if (!stylesheet) {
		const existingLink = Array.from(
			document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
		).find((link) => link.href === href);
		const link = existingLink ?? document.createElement('link');
		const resource: PreviewStylesheet = {
			link,
			status: existingLink?.sheet ? 'loaded' : 'loading',
		};
		if (!existingLink) {
			link.rel = 'stylesheet';
			link.href = href;
		}
		// Cache the result independently of cards, including when all unmount.
		link.onload = () => {
			resource.status = 'loaded';
		};
		link.onerror = () => {
			resource.status = 'failed';
		};
		stylesheets.set(href, resource);
		// Native links avoid preinit's unhandled rejection on stylesheet errors.
		if (!existingLink) document.head.appendChild(link);
		stylesheet = resource;
	}
	return stylesheet;
};

export const usePreviewStylesheet = (
	stylesheetHref: string,
	enabled: boolean,
) => {
	const [shouldLoadStylesheet, setShouldLoadStylesheet] = useState(enabled);
	const [status, setStatus] = useState<StylesheetStatus>(
		() => stylesheets.get(stylesheetHref)?.status ?? 'loading',
	);

	useEffect(() => {
		// Keep loading enabled when a card leaves the viewport mid-request.
		if (enabled) setShouldLoadStylesheet(true);
	}, [enabled]);

	useEffect(() => {
		if (!shouldLoadStylesheet) return;
		const stylesheet = loadStylesheet(stylesheetHref);
		setStatus(stylesheet.status);
		if (stylesheet.status !== 'loading') return;

		const timeoutId = window.setTimeout(() => setStatus('failed'), 15_000);
		const settled = () => {
			window.clearTimeout(timeoutId);
			setStatus(stylesheet.status);
		};
		stylesheet.link.addEventListener('load', settled);
		stylesheet.link.addEventListener('error', settled);
		return () => {
			window.clearTimeout(timeoutId);
			stylesheet.link.removeEventListener('load', settled);
			stylesheet.link.removeEventListener('error', settled);
		};
	}, [shouldLoadStylesheet, stylesheetHref]);

	return status;
};
