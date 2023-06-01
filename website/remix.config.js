/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	ignoredRouteFiles: [ '**/.*' ],
	serverDependenciesToBundle: [
		'ky',
		'nanoid',
		/^unist.*/,
		/^vfile.*/,
	],
	watchPaths: [ './docs/**/*' ],
	future: {
		v2_meta: true,
	}
};
