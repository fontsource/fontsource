import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

export default defineConfig(({ isSsrBuild }) => ({
	server: {
		port: 8080,
	},
	// We only need to target ES2022 for the server build
	// for top-level await support
	build: isSsrBuild ? { target: 'ES2022' } : {},
	plugins: [
		remix({
			postcss: true,
		}),
		cjsInterop({
			dependencies: ['fontfaceobserver', 'react-wrap-balancer'],
		}),
		tsconfigPaths(),
	],
}));
