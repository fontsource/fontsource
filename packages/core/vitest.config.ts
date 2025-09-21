import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Test environment configuration
		environment: 'node',

		// Global test setup
		globals: false,

		// Test file patterns
		include: [
			'tests/**/*.{test,spec}.{js,ts}',
			'tests/integration/**/*.{test,spec}.{js,ts}',
		],

		// Exclude patterns
		exclude: ['node_modules/**', 'dist/**', 'tests/integration/fixtures/**'],

		// Test timeout (integration tests may take longer)
		testTimeout: 30000,

		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'tests/**',
				'**/*.d.ts',
				'**/*.config.*',
				'**/fixture-utils.ts',
				'dist/**',
			],
			include: ['src/**/*.ts'],
		},

		// Reporter configuration
		reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],

		// Sequencing (run integration tests after unit tests)
		sequence: {
			hooks: 'stack',
		},

		// Pool options for better performance
		pool: 'threads',
		poolOptions: {
			threads: {
				singleThread: false,
				minThreads: 1,
				maxThreads: process.env.CI ? 2 : undefined,
			},
		},

		// Setup files
		setupFiles: [],

		// Environment variables
		env: {
			NODE_ENV: 'test',
		},
	},
});
