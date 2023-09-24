const { builtinModules } = require('module');

/** @type {import('@remix-run/dev').AppConfig} */

// eslint-disable-next-line unicorn/prefer-module
module.exports = {
	postcss: true,
	ignoredRouteFiles: ['**/.*'],
	serverDependenciesToBundle: ['ky', 'nanoid', /^unist.*/, /^vfile.*/],
	watchPaths: ['./docs/**/*'],
	serverModuleFormat: 'cjs',
	browserNodeBuiltinsPolyfill: {
		modules: builtinModules,
	},
};
