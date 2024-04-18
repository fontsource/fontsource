import type { MetaDescriptor } from '@remix-run/react';

interface OGMeta {
	title?: string;
	description?: string;
}

export const ogMeta = ({ title, description }: OGMeta): MetaDescriptor[] => {
	return [
		{
			title: title ?? 'Fontsource',
		},
		{
			name: 'description',
			content:
				description ??
				'Download and self-host 1500+ open-source fonts in neatly bundled NPM packages. Access a comprehensive library of web typefaces for free.',
		},
		{
			property: 'og:title',
			content: title ?? 'Fontsource',
		},
		{
			property: 'og:description',
			content:
				description ??
				'Download and self-host 1500+ open-source fonts in neatly bundled NPM packages. Access a comprehensive library of web typefaces for free.',
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
			content:
				description ??
				'Download and self-host 1500+ open-source fonts in neatly bundled NPM packages. Access a comprehensive library of web typefaces for free.',
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
				url: 'https://fontsource.org',
				logo: 'https://fontsource.org/logo.png',
			},
		},
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				url: 'https://fontsource.org',
				name: 'Fontsource',
				description:
					'Download and self-host 1500+ open-source fonts in neatly bundled NPM packages. Access a comprehensive library of web typefaces for free.',
			},
		},
	];
};
