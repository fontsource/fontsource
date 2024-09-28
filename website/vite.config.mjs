import {
	vitePlugin as remix,
	cloudflareDevProxyVitePlugin,
} from '@remix-run/dev';
import { defineConfig } from 'vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import tsconfigPaths from 'vite-tsconfig-paths';

import { getLoadContext } from './load-context';

export default defineConfig(({ isSsrBuild }) => ({
	server: {
		port: 8080,
	},
	// We only need to target ES2022 for the server build
	// for top-level await support
	build: isSsrBuild ? { target: 'ES2022', minify: true } : { minify: true },
	plugins: [
		cloudflareDevProxyVitePlugin({
			getLoadContext,
		}),
		remix({
			postcss: true,
		}),
		cjsInterop({
			dependencies: ['fontfaceobserver', 'react-wrap-balancer'],
		}),
		tsconfigPaths(),
	],
	ssr: {
		resolve: {
			conditions: ['workerd', 'worker', 'browser'],
		},
	},
	resolve: {
		mainFields: ['browser', 'module', 'main'],
	},
}));
