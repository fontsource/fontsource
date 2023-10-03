/* eslint-disable unicorn/prefer-module */
const { builtinModules } = require('node:module');

/** @type {import('@remix-run/dev').AppConfig} */
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
	serverModuleFormat: 'cjs',
	watchPaths: ['./docs/**/*'],
	browserNodeBuiltinsPolyfill: {
		modules: builtinModules,
	},
};
