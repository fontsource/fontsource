import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import remarkSmartypants from 'remark-smartypants';

export const docs = defineDocs({
	dir: 'docs',
	docs: {
		schema: pageSchema,
		postprocess: {
			includeProcessedMarkdown: true,
		},
	},
});

export default defineConfig({
	mdxOptions: {
		remarkPlugins: (plugins) => [...plugins, remarkSmartypants],
	},
});
