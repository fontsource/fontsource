import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage/container',
			include: ['container/**/*.ts'],
			exclude: ['container/**/*.d.ts'],
		},
		include: ['container/**/*.test.ts'],
	},
});
