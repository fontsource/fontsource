require("@ayuhito/eslint-config/patch");

module.exports = {
  extends: ["@ayuhito/eslint-config/profile/node"],
	parserOptions: { tsconfigRootDir: __dirname },
	rules: {
		"no-await-in-loop": "off"
	}
};
