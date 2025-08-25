import { cloudflare } from '@cloudflare/vite-plugin';
import mdx from '@mdx-js/rollup';
import { reactRouter } from '@react-router/dev/vite';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkSmartypants from 'remark-smartypants';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	css: { postcss: './postcss.config.cjs' },
	build: {
		minify: 'terser',
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
		mdx({
			providerImportSource: '@mdx-js/react',
			remarkPlugins: [
				remarkFrontmatter,
				remarkMdxFrontmatter,
				remarkGfm,
				remarkSmartypants,
			],
			rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
		}),
		reactRouter(),
		babel({
			filter: /\.[jt]sx?$/,
			babelConfig: {
				presets: ['@babel/preset-typescript'],
				plugins: [['babel-plugin-react-compiler', {}]],
			},
		}),
		tsconfigPaths(),
	],
	ssr: {
		target: 'webworker',
		noExternal: true,
		resolve: {
			conditions: ['worker', 'workerd', 'browser'],
		},
	},
	resolve: {
		mainFields: ['browser', 'module', 'main'],
		alias: {
			react: 'react',
			'react-dom': 'react-dom',
		},
	},
});
