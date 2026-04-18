import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: {
				configPath: './wrangler.toml',
			},
		}),
	],
	optimizeDeps: {
		exclude: ['@fontsource-utils/core'],
	},
	ssr: {
		noExternal: [/^@fontsource-utils\/core/],
		target: 'webworker',
	},
	test: {
		include: ['tests/**/*.test.ts'],
	},
});
