module.exports = {
	extends: ['@ayuhito/eslint-config'],
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: './tsconfig.json',
	},
	rules: {
		'no-console': 'off',
		'import/no-default-export': 'off',
	},
};
