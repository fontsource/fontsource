import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: { pino: 'pino/browser.js' },
	},
	plugins: [
		cloudflareTest(async () => ({
			wrangler: {
				configPath: './wrangler.toml',
			},
			miniflare: {
				bindings: {
					TEST_MIGRATIONS: await readD1Migrations(
						path.join(import.meta.dirname, 'migrations'),
					),
				},
			},
		})),
	],
	optimizeDeps: {
		exclude: ['@fontsource-utils/core'],
	},
	ssr: {
		noExternal: [/^@fontsource-utils\/core/],
		target: 'webworker',
	},
	test: {
		coverage: {
			provider: 'istanbul',
			reportsDirectory: './coverage/worker',
			include: ['worker/src/**/*.ts', 'shared/**/*.ts'],
		},
		include: ['tests/**/*.test.ts'],
	},
});
