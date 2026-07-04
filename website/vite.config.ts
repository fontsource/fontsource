import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import babel from '@rolldown/plugin-babel';
import { reactCompilerPreset } from '@vitejs/plugin-react';
import browserslist from 'browserslist';
import mdx from 'fumadocs-mdx/vite';
import { browserslistToTargets } from 'lightningcss';
import { defineConfig } from 'vite';
import * as MdxConfig from './source.config';

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
		mdx(MdxConfig),
		babel({
			presets: [reactCompilerPreset()],
		}),
		reactRouter(),
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
			'@fontsource-utils/core': fileURLToPath(
				new URL('../packages/core/src/index.ts', import.meta.url),
			),
			react: 'react',
			'react-dom': 'react-dom',
		},
	},
});
