import type { Metadata } from '../types';

const standardReadme = (
	{ id, family, version, weights, styles, subsets, license }: Metadata,
	isVariable: boolean
) => `# Fontsource ${family}

[![npm (scoped)](https://img.shields.io/npm/v/@fontsource/${id}?color=brightgreen)](https://www.npmjs.com/package/@fontsource/${id}) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/@fontsource/${id})](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/@fontsource/${id})](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “${family}” font. Please visit the main [Fontsource website](https://fontsource.org/fonts/${id}) to view more details on this package.
${
	isVariable
		? '\nThis particular typeface supports [variable fonts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide). Variable documentation can be found [here](https://fontsource.org/docs/getting-started/variable).\n\n'
		: ''
}
## Quick Installation

Fontsource offers multiple methods to import the CSS, including using a bundler like Vite or using SASS. You can find full documentation [here](https://fontsource.org/docs/getting-started/introduction).

\`\`\`javascript
npm install @fontsource/${id}
\`\`\`

Within your app entry file or site component, import it in.

\`\`\`javascript
import "@fontsource/${id}"; // Defaults to weight 400
import "@fontsource/${id}/400.css"; // Specify weight
import "@fontsource/${id}/400-italic.css"; // Specify weight and style
\`\`\`

Supported variables:
- Weights: \`[${weights}]\`
- Styles: \`[${styles}]\`
- Subsets: \`[${subsets}]\`

> Note: \`italic\` may not be supported by all fonts. To learn more about what weights and styles are supported, please visit the [Fontsource website](https://fontsource.org/fonts/${id}).

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

\`\`\`css
body {
  font-family: "${family}";
}
\`\`\`

## Licensing
Always make sure to read the license for each font you use. Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

${license.attribution}
[${license.type}](${license.url})

## Other Notes
Font version (provided by source): \`${version}\`.

If you have any suggestions or ideas to improve the performance of font loading or expand the existing library, feel free to star and contribute to this repository. You can share your suggestions or ideas by creating an [issue](https://github.com/fontsource/fontsource/issues).`;

const variableReadme = ({
	id,
	family,
	version,
	weights,
	styles,
	subsets,
	variable,
	license,
}: Metadata) => `# Fontsource ${family}

[![npm (scoped)](https://img.shields.io/npm/v/@fontsource-variable/${id}?color=brightgreen)](https://www.npmjs.com/package/@fontsource-variable/${id}) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/@fontsource-variable/${id})](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/@fontsource-variable/${id})](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “${family}” variable font. Please visit the main [Fontsource website](https://fontsource.org/fonts/${id}) to view more details on this package.

## Quick Installation

Fontsource offers multiple methods to import the CSS, including using a bundler like Vite or using SASS. You can find full documentation [here](https://fontsource.org/docs/getting-started/introduction).

\`\`\`javascript
npm install @fontsource-variable/${id}
\`\`\`

Within your app entry file or site component, import it in.

\`\`\`javascript
import "@fontsource-variable/${id}"; // Defaults to wght axis
import "@fontsource-variable/${id}/wght.css"; // Specify axis
import "@fontsource-variable/${id}/wght-italic.css"; // Specify axis and style
\`\`\`

Supported variables:
- Weights: \`[${weights}]\`
- Styles: \`[${styles}]\`
- Subsets: \`[${subsets}]\`
- Axes: \`[${Object.keys(variable).filter((axis) => axis !== 'ital')}]\`

> Note: \`italic\` may not be supported by all fonts. To learn more about what axes and styles are supported, please visit the [Fontsource website](https://fontsource.org/fonts/${id}).

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

\`\`\`css
body {
  font-family: "${family}";
}
\`\`\`

## Licensing
Always make sure to read the license for each font you use. Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

${license.attribution}
[${license.type}](${license.url})

## Other Notes
Font version (provided by source): \`${version}\`.

If you have any suggestions or ideas to improve the performance of font loading or expand the existing library, feel free to star and contribute to this repository. You can share your suggestions or ideas by creating an [issue](https://github.com/fontsource/fontsource/issues).`;

const readme = (metadata: Metadata, isVariable: boolean) => {
	if (isVariable) return variableReadme(metadata);
	return standardReadme(metadata, isVariable);
};

export { readme };
