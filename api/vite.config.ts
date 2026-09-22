import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [cloudflare()],
	build: {
		sourcemap: process.env.POSTHOG_API_KEY ? 'hidden' : false,
	},
	define: {
		'import.meta.env.API_RELEASE': JSON.stringify(
			process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local',
		),
	},
	optimizeDeps: {
		exclude: ['@fontsource-utils/core'],
	},
	ssr: {
		noExternal: [/^@fontsource-utils\/core/],
	},
});
