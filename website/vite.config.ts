import fs from 'node:fs';
import { cloudflare } from '@cloudflare/vite-plugin';
import mdx from '@mdx-js/rollup';
import { reactRouter } from '@react-router/dev/vite';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkSmartypants from 'remark-smartypants';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';

const targets = browserslistToTargets(
	browserslist([
		'chrome >= 111',
		'edge >= 111',
		'firefox >= 114',
		'safari >= 16.4',
	]),
);

const customMedia = fs.readFileSync('./app/styles/_media.css', 'utf-8');

export default defineConfig({
	build: {
		cssMinify: 'lightningcss',
		minify: 'terser',
	},
	worker: {
		format: 'es',
		plugins: () => [],
	},
	css: {
		transformer: 'lightningcss',
		lightningcss: {
			targets,
			drafts: {
				customMedia: true,
			},
		},
	},
	plugins: [
		{
			name: 'css-additional-data',
			enforce: 'pre',
			transform(code, id) {
				if (id.endsWith('.css') || id.endsWith('.css?inline')) {
					return `${customMedia}\n${code}`;
				}
			},
		},
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
	],
	optimizeDeps: {
		exclude: ['@fontsource-utils/core', '@glypht/core'],
		include: ['@glypht/web-worker'],
	},
	ssr: {
		target: 'webworker',
		noExternal: [/^(?!@fontsource-utils\/core).*$/],
		resolve: {
			conditions: ['worker', 'workerd', 'browser'],
		},
	},
	resolve: {
		tsconfigPaths: true,
		mainFields: ['browser', 'module', 'main'],
		alias: {
			react: 'react',
			'react-dom': 'react-dom',
		},
	},
});
