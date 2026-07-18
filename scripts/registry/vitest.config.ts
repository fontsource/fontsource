import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['scripts/registry/**/*.test.ts'],
	},
});
