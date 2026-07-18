import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import remarkSmartypants from 'remark-smartypants';
import { z } from 'zod';

import { fontsourceCodeTheme } from './app/components/code/theme';

export const docs = defineDocs({
	dir: 'docs',
	docs: {
		schema: pageSchema.extend({
			description: z.string(),
		}),
		postprocess: {
			includeProcessedMarkdown: {
				mdxAsPlaceholder: ['PackageManagerCode'],
			},
		},
	},
});

export default defineConfig({
	mdxOptions: {
		rehypeCodeOptions: {
			addLanguageClass: true,
			defaultLanguage: 'plaintext',
			fallbackLanguage: 'plaintext',
			langAlias: {
				txt: 'plaintext',
				text: 'plaintext',
				shell: 'sh',
			},
			themes: {
				light: fontsourceCodeTheme,
				dark: fontsourceCodeTheme,
			},
		},
		remarkPlugins: (plugins) => [...plugins, remarkSmartypants],
	},
});
