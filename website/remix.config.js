/** @type {import('@remix-run/dev').AppConfig} */
// eslint-disable-next-line unicorn/prefer-module
module.exports = {
	ignoredRouteFiles: ['**/.*'],
	serverDependenciesToBundle: ['ky', 'nanoid', /^unist.*/, /^vfile.*/],
	watchPaths: ['./docs/**/*'],
	future: {
		v2_meta: true,
	},
};
