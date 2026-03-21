import type { MetaDescriptor } from 'react-router';

interface OGMeta {
	title?: string;
	description?: string;
	canonicalPath?: string;
}

const DEFAULT_DESCRIPTION =
	'Download and self-host 2000+ open-source fonts in neatly bundled NPM packages. Access a comprehensive library of web typefaces for free.';

export const SITE_ORIGIN = 'https://fontsource.org';

export const toAbsoluteUrl = (path: string) =>
	new URL(path, SITE_ORIGIN).toString();

export const ogMeta = ({
	title,
	description,
	canonicalPath,
}: OGMeta): MetaDescriptor[] => {
	const resolvedCanonical = canonicalPath
		? toAbsoluteUrl(canonicalPath)
		: undefined;

	const meta: MetaDescriptor[] = [
		{
			title: title ?? 'Fontsource',
		},
		{
			name: 'description',
			content: description ?? DEFAULT_DESCRIPTION,
		},
		{
			property: 'og:title',
			content: title ?? 'Fontsource',
		},
		{
			property: 'og:description',
			content: description ?? DEFAULT_DESCRIPTION,
		},
		{
			property: 'og:image',
			content: '/og-image.png',
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
			content: title ?? 'Fontsource',
		},
		{
			name: 'twitter:description',
			content: description ?? DEFAULT_DESCRIPTION,
		},
		{
			name: 'twitter:image',
			content: '/og-image.png',
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'Organization',
				name: 'Fontsource',
				url: SITE_ORIGIN,
				logo: `${SITE_ORIGIN}/logo.png`,
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

	if (resolvedCanonical) {
		meta.push({
			tagName: 'link',
			rel: 'canonical',
			href: resolvedCanonical,
		});
	}

	return meta;
};
