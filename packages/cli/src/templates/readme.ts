import type { Metadata } from '../types';

const variableText = () => `## Variable Fonts

This particular typeface supports [variable fonts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide).
Variable documentation can be found [here](https://fontsource.org/docs/variable-fonts).\n\n`;

const readme = (
	{
		id,
		family,
		version,
		weights,
		styles,
		subsets,
		variable,
		license,
	}: Metadata,
	isVariable: boolean
) => `# Fontsource ${family}

[![npm (scoped)](https://img.shields.io/npm/v/@fontsource/${id}?color=brightgreen)](https://www.npmjs.com/package/@fontsource/${id}) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/@fontsource/${id})](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/@fontsource/${id})](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “${family}” font. Please visit the main [Fontsource website](https://fontsource.org/fonts/${id}) to view more details on this package.

## Quick Installation

Fontsource has a variety of methods to import CSS, such as using a bundler like Webpack. Alternatively, it supports SASS. Full documentation can be found [here](https://fontsource.org/docs/introduction).

\`\`\`javascript
npm install ${isVariable ? `@fontsource-variable/${id}` : `@fontsource/${id}`}
\`\`\`

Within your app entry file or site component, import it in.

\`\`\`javascript
${
	isVariable
		? `import "@fontsource-variable/${id}"; // Defaults to wght axis
import "@fontsource-variable/${id}/wght.css"; // Specify axis
import "@fontsource-variable/${id}/wght-italic.css"; // Specify axis and style`
		: `import "@fontsource/${id}"; // Defaults to weight 400
import "@fontsource/${id}/400.css"; // Specify weight
import "@fontsource/${id}/400-italic.css"; // Specify weight and style`
}

\`\`\`

Supported variables:
- Weights: \`[${weights}]\`
- Styles: \`[${styles}]\`
- Subsets: \`[${subsets}]\`${
	isVariable ? `\n- Axes: \`[${Object.keys(variable).filter(axis => axis !== 'ital')}]\`` : ''
}

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

\`\`\`css
body {
  font-family: "${family};
}
\`\`\`

${variable ? variableText() : ''}## Licensing
It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

${license.attribution}
[${license.type}](${license.url})

## Other Notes
Font version (provided by source): \`${version}\`.
Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).`;

export { readme };
