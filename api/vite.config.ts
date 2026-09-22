import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
	resolve: {
		alias: { pino: 'pino/browser.js' },
	},
	plugins: [cloudflare()],
	optimizeDeps: {
		exclude: ['@fontsource-utils/core'],
	},
	ssr: {
		noExternal: [/^@fontsource-utils\/core/],
	},
});
