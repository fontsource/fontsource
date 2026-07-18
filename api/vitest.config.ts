import path from 'node:path';
import {
	cloudflareTest,
	readD1Migrations,
} from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
		include: ['tests/**/*.test.ts'],
	},
});
