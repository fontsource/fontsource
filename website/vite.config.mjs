import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import topLevelAwait from 'vite-plugin-top-level-await';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

export default defineConfig({
	server: {
		port: 8080,
	},
	plugins: [
		remix({
			postcss: true,
			ignoredRouteFiles: ['**/.*'],
			watchPaths: ['./docs/*'],
		}),
		cjsInterop({
			dependencies: [
				'fontfaceobserver',
				'prismjs/components/prism-scss',
				'prismjs/components/prism-json',
				'prismjs/components/prism-bash',
				'react-wrap-balancer',
			],
		}),
		topLevelAwait(),
		tsconfigPaths(),
	],
});
