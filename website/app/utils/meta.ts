import type { MetaDescriptor } from '@remix-run/react';

interface OGMeta {
	title: string;
	description: string;
}

export const ogMeta = ({ title, description }: OGMeta): MetaDescriptor[] => {
	return [
		{
			title,
		},
		{
			name: 'description',
			content: description,
		},
		{
			property: 'og:title',
			content: title,
		},
		{
			property: 'og:description',
			content: description,
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
			content: title,
		},
		{
			name: 'twitter:description',
			content: description,
		},
		{
			name: 'twitter:image',
			content: '/og-image.png',
		},
	];
};
