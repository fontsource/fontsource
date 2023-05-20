import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		clearMocks: true,
		setupFiles: ['./tests/helpers/setup-tests.ts'],
	},
});
