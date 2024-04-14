import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

export default defineConfig({
	server: {
		port: 8080,
	},
	build: {
		target: 'ES2022',
	},
	plugins: [
		remix({
			postcss: true,
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
		tsconfigPaths(),
	],
});
