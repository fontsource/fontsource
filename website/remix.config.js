/// import { builtinModules } from 'module';

/** @type {import('@remix-run/dev').AppConfig} */
// eslint-disable-next-line unicorn/prefer-module
module.exports = {
	postcss: true,
	ignoredRouteFiles: ['**/.*'],
	serverDependenciesToBundle: [
		'@mantine/core',
		'ky',
		'nanoid',
		/^unist.*/,
		/^vfile.*/,
	],
	watchPaths: ['./docs/**/*'],
	future: {
		v2_meta: true,
		v2_headers: true,
		v2_errorBoundary: true,
		v2_routeConvention: true,
		v2_normalizeFormMethod: true,
	},
};
