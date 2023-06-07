module.exports = {
	extends: [
		'@ayuhito/eslint-config',
		'@remix-run/eslint-config',
		'@remix-run/eslint-config/node',
	],
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: './tsconfig.json',
	},
	rules: {
		'@typescript-eslint/consistent-indexed-object-style': 'off',
		// Remix lets you throw other things than errors
		'@typescript-eslint/no-throw-literal': 'off',
		'no-console': 'off',
		// Doesn't suit react conventions
		'unicorn/filename-case': 'off',
		// Routes have default exports
		'import/no-default-export': 'off',
		// Remix compile target doesn't support replaceAll
		'unicorn/prefer-string-replace-all': 'off',
	},
};
