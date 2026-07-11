import type { MetaDescriptor } from 'react-router';

const SITE_ORIGIN = 'https://fontsource.org';
const DEFAULT_TITLE = 'Fontsource — Self-host Open Source Fonts';
const DEFAULT_DESCRIPTION =
	'Discover and self-host 2,000+ open-source fonts with versioned npm packages, direct downloads, configurable CDN URLs, and a free API.';
const DEFAULT_IMAGE = new URL('/og-image.png', SITE_ORIGIN).href;

export const getCanonicalUrl = (pathname: string) =>
	new URL(pathname.replace(/\/+$/, '') || '/', SITE_ORIGIN).href;

interface OGMeta {
	title?: string;
	description?: string;
}

export const ogMeta = ({ title, description }: OGMeta): MetaDescriptor[] => {
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
			content: DEFAULT_IMAGE,
		},
		{
			property: 'og:image:width',
			content: '1200',
		},
		{
			property: 'og:image:height',
			content: '800',
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
			content: DEFAULT_IMAGE,
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
