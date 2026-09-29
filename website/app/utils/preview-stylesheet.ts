interface PreviewStylesheet {
	link: HTMLLinkElement;
	loaded: Promise<void>;
}

const stylesheets = new Map<string, PreviewStylesheet>();

export const loadPreviewStylesheet = (href: string): Promise<void> => {
	const cached = stylesheets.get(href);

	// Browse also renders route-owned links, which disappear on navigation.
	if (cached?.link.isConnected) return cached.loaded;

	const existing = Array.from(
		document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
	).find((link) => link.href === href);
	const link = existing ?? document.createElement('link');

	const loaded = new Promise<void>((resolve, reject) => {
		if (link.sheet) return resolve();

		const cleanup = () => {
			link.removeEventListener('load', onLoad);
			link.removeEventListener('error', onError);
		};

		const onLoad = () => {
			cleanup();
			resolve();
		};

		const onError = () => {
			cleanup();
			reject(new Error(`Stylesheet failed to load: ${href}`));
		};

		link.addEventListener('load', onLoad);
		link.addEventListener('error', onError);

		if (!existing) {
			link.rel = 'stylesheet';
			link.href = href;
			document.head.appendChild(link);
		}
	});

	stylesheets.set(href, { link, loaded });

	return loaded;
};
