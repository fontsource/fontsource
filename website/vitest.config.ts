import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage/node',
			include: ['app/**/*.{ts,tsx}'],
			exclude: ['app/generated/**', '**/*.test.{ts,tsx}'],
		},
	},
});
