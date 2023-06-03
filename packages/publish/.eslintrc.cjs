module.exports = {
	extends: ['@ayuhito/eslint-config'],
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: './tsconfig.json',
	},
	rules: {
		'@typescript-eslint/no-non-null-assertion': 'warn',
	},
};
