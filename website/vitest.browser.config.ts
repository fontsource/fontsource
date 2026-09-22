import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	resolve: { tsconfigPaths: true },
	test: {
		include: ['app/**/*.browser.test.{ts,tsx}'],
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage/browser',
			// Route loaders and server utilities belong to the Node coverage report.
			include: [
				'app/components/**/*.{ts,tsx}',
				'app/features/projects/**/*.{ts,tsx}',
				'app/hooks/**/*.{ts,tsx}',
				'app/bones/**/*.{ts,tsx}',
			],
			exclude: ['app/generated/**', '**/*.test.{ts,tsx}', 'app/test/**'],
		},
		browser: {
			enabled: true,
			headless: true,
			provider: playwright(),
			commands: {
				async stubFontStylesheets({ context }) {
					await context.unroute('https://cdn.jsdelivr.net/**');
					await context.route('https://cdn.jsdelivr.net/**', (route) =>
						route.fulfill({ contentType: 'text/css', body: '' }),
					);
				},
			},
			instances: [{ browser: 'chromium' }],
		},
	},
});
