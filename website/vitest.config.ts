import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		exclude: [...configDefaults.exclude, '**/*.browser.test.{ts,tsx}'],
		// Coverage measures this Node suite; browser scenarios run separately.
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage/node',
			include: ['app/**/*.{ts,tsx}'],
			exclude: ['app/generated/**', '**/*.test.{ts,tsx}', 'app/test/**'],
		},
	},
});
