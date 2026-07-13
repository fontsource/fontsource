import type { MetaDescriptor } from 'react-router';

const SITE_ORIGIN = 'https://fontsource.org';
const DEFAULT_TITLE = 'Fontsource — Self-host Open Source Fonts';
const DEFAULT_DESCRIPTION =
	'Discover and self-host 2,000+ open-source fonts with versioned npm packages, direct downloads, configurable CDN URLs, and a free API.';
const API_ORIGIN = 'https://api.fontsource.org';

interface OpenGraphImage {
	url: string;
	width: number;
	height: number;
}

const DEFAULT_IMAGE: OpenGraphImage = {
	url: new URL('/og-image.png', SITE_ORIGIN).href,
	width: 1200,
	height: 800,
};

export const getCanonicalUrl = (pathname: string) =>
	new URL(pathname.replace(/\/+$/, '') || '/', SITE_ORIGIN).href;

interface OGMeta {
	title?: string;
	description?: string;
	image?: OpenGraphImage;
}

interface FontOpenGraphMetadata {
	id: string;
	lastModified: string;
}

export const getFontOpenGraphImage = ({
	id,
	lastModified,
}: FontOpenGraphMetadata): OpenGraphImage => {
	const url = new URL(`/og/fonts/${encodeURIComponent(id)}`, API_ORIGIN);
	url.searchParams.set('v', lastModified);

	return {
		url: url.href,
		width: 1200,
		height: 630,
	};
};

export const ogMeta = ({
	title,
	description,
	image = DEFAULT_IMAGE,
}: OGMeta): MetaDescriptor[] => {
	return [
		{
			title: title ?? DEFAULT_TITLE,
		},
		{
			name: 'description',
			content: description ?? DEFAULT_DESCRIPTION,
		},
		{
			property: 'og:title',
			content: title ?? DEFAULT_TITLE,
		},
		{
			property: 'og:description',
			content: description ?? DEFAULT_DESCRIPTION,
		},
		{
			property: 'og:type',
			content: 'website',
		},
		{
			property: 'og:image',
			content: image.url,
		},
		{
			property: 'og:image:width',
			content: String(image.width),
		},
		{
			property: 'og:image:height',
			content: String(image.height),
		},
		{
			name: 'twitter:card',
			content: 'summary_large_image',
		},
		{
			name: 'twitter:site',
			content: '@ayuhitoo',
		},
		{
			name: 'twitter:title',
			content: title ?? DEFAULT_TITLE,
		},
		{
			name: 'twitter:description',
			content: description ?? DEFAULT_DESCRIPTION,
		},
		{
			name: 'twitter:image',
			content: image.url,
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'Organization',
				name: 'Fontsource',
				url: SITE_ORIGIN,
				logo: new URL('/icon.png', SITE_ORIGIN).href,
			},
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				url: SITE_ORIGIN,
				name: 'Fontsource',
				description: DEFAULT_DESCRIPTION,
			},
		},
	];
};
