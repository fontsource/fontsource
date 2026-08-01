import path from 'node:path';
import {
	cloudflareTest,
	readD1Migrations,
} from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		cloudflareTest(async () => ({
			miniflare: {
				compatibilityDate: '2025-08-15',
				compatibilityFlags: ['nodejs_compat'],
				d1Databases: ['APP_DB'],
				bindings: {
					BETTER_AUTH_URL: 'https://fontsource.org',
					BETTER_AUTH_SECRET: 'test-secret-at-least-32-characters-long',
					GOOGLE_CLIENT_ID: 'google-client-id',
					GOOGLE_CLIENT_SECRET: 'google-client-secret',
					GITHUB_CLIENT_ID: 'github-client-id',
					GITHUB_CLIENT_SECRET: 'github-client-secret',
					TEST_MIGRATIONS: await readD1Migrations(
						path.join(import.meta.dirname, 'migrations'),
					),
				},
			},
		})),
	],
	test: {
		include: ['tests/**/*.worker.ts'],
	},
});
