import { defineConfig } from 'vitest/config';

// We need to run api tests separately from packager tests due to Miniflare conflicts
export default defineConfig({
	test: {
		environment: 'miniflare',
		environmentOptions: {
			bindings: {
				UPLOAD_KEY: 'test',
			},
		},
		clearMocks: true,
	},
});
