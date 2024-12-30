import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		clearMocks: true,
		forceRerunTriggers: [
			'**/*.scss',
			'**/package.json/**',
			'**/vitest.config.*/**',
			'**/vite.config.*/**',
		],
	},
});
