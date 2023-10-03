/* eslint-disable unicorn/prefer-module */

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
};
