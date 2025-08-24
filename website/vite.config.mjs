import mdx from '@mdx-js/rollup';
import {
	cloudflareDevProxyVitePlugin,
	vitePlugin as remix,
} from '@remix-run/dev';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkSmartypants from 'remark-smartypants';
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
		mdx({
			providerImportSource: '@mdx-js/react',
			remarkPlugins: [
				remarkFrontmatter,
				remarkMdxFrontmatter,
				remarkGfm,
				remarkSmartypants,
			],
			rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
		}),
		remix({
			postcss: true,
			future: {
				v3_fetcherPersist: true,
				v3_relativeSplatPath: true,
				v3_throwAbortReason: true,
				v3_routeConfig: true,
				v3_singleFetch: true,
				v3_lazyRouteDiscovery: true,
			},
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
