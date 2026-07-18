import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			reportsDirectory: './coverage/container',
		},
		include: ['container/**/*.test.ts'],
	},
});
