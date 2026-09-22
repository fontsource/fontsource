import { cloudflare } from '@cloudflare/vite-plugin';
import posthog from '@posthog/rollup-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
	resolve: {
		alias: { pino: 'pino/browser.js' },
	},
	plugins: [
		cloudflare(),
		process.env.POSTHOG_API_KEY &&
			posthog({
				personalApiKey: process.env.POSTHOG_API_KEY,
				projectId: '280021',
				host: 'https://eu.posthog.com',
				sourcemaps: { releaseName: 'fontsource-api' },
			}),
	],
	optimizeDeps: {
		exclude: ['@fontsource-utils/core'],
	},
	ssr: {
		noExternal: [/^@fontsource-utils\/core/],
	},
});
