import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		exclude: [...configDefaults.exclude, '**/*.browser.test.{ts,tsx}'],
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage/node',
			include: ['app/**/*.{ts,tsx}'],
			exclude: ['app/generated/**', '**/*.test.{ts,tsx}', 'app/test/**'],
		},
	},
});
