/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	ignoredRouteFiles: ['**/.*'],
	serverDependenciesToBundle: [
		'ky',
		'@fontsource/inter',
		'@fontsource/source-code-pro',
	],
	future: {
		unstable_cssSideEffectImports: true,
	},
};
