const _ = require(`lodash`)

exports.packageJson = _.template(
  `{
  "name": "fontsource-<%= fontId %>",
  "version": "3.1.0",
  "description": "<%= fontName %> font in NPM glory.",
  "main": "index.css",
  "keywords": [
    "fontsource",
    "font",
    "font family",
    "<%= fontName %>",
    "<%= fontId %>",
    "css",
    "front-end",
    "web",
    "typeface"
  ],
  "author": "Lotus <declininglotus@gmail.com>",
  "license": "MIT",
  "homepage": "https://github.com/fontsource/fontsource/tree/master/packages/<%= fontId %>#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/fontsource/fontsource.git",
    "directory": "packages/<%= fontId %>"
  }
}
`
)

exports.packageJsonRebuild = _.template(
  `{
  "name": "<%= name %>",
  "version": "<%= version %>",
  "description": "<%= fontName %> font in NPM glory.",
  "main": "index.css",
  "keywords": [
    "fontsource",
    "font",
    "font family",
    "<%= fontName %>",
    "<%= fontId %>",
    "css",
    "front-end",
    "web",
    "typeface"
  ],
  "author": "Lotus <declininglotus@gmail.com>",
  "license": "MIT",
  "homepage": "https://github.com/fontsource/fontsource/tree/master/packages/<%= fontId %>#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/fontsource/fontsource.git",
    "directory": "packages/<%= fontId %>"
  }
}
`
)

exports.fontFace = _.template(
  `/* <%= fontId %>-<%= subset %>-<%= weight %>-<%= style %>*/
@font-face {
  font-family: '<%= fontName %>';
  font-style: <%= style %>;
  font-display: swap;
  font-weight: <%= weight %>;
  src:
    url('<%= woff2Path %>') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
    url('<%= woffPath %>') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
`
)

exports.readme = _.template(
  `# Fontsource <%= fontName %>

[![npm version](https://badge.fury.io/js/fontsource-<%= fontId %>.svg)](https://www.npmjs.com/package/fontsource-<%= fontId %>) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/fontsource-<%= fontId %>)](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/fontsource-<%= fontId %>)](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “<%= fontName %>” font. Please visit the main [Fontsource monorepo](https://github.com/fontsource/fontsource) to view more details on this package.

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

\`\`\`javascript
yarn add fontsource-<%= fontId %> // npm install fontsource-<%= fontId %>
\`\`\`

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (\`layout.js\`), page component (\`index.js\`), or \`gatsby-browser.js\`.

\`\`\`javascript
import "fontsource-<%= fontId %>" // Defaults to weight 400 with normal variant.
\`\`\`

Fontsource allows you to select font subsets, weights and even individual styles, allowing you to cut down on payload sizes to the last byte! The default selection above, however, sticks to the Latin subset including all weights and styles.

\`\`\`javascript
import "fontsource-<%= fontId %>/latin-ext.css" // All weights with normal style included.
import "fontsource-<%= fontId %>/cyrillic-ext-500.css" // Weight 500 with normal style.
import "fontsource-<%= fontId %>/greek-900-italic.css" // Italic variant.
\`\`\`

Alternatively, the same solutions could be imported via SCSS!

\`\`\`scss
@import "~fontsource-<%= fontId %>/index.css"; // Weight 400.
@import "~fontsource-<%= fontId %>/vietnamese-300-italic.css";
\`\`\`

_These examples may not reflect actual compatibility. Please refer below._

Supported variables:

- Subsets: \`[<%= subsets %>]\`
- Weights: \`[<%= weights %>]\`
- Styles: \`[<%= styles %>]\`

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

\`\`\`css
body {
  font-family: "<%= fontName %>";
}
\`\`\`

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

Font [Source](<%= source %>) and [License](<%= license %>).

## Other Notes

Font version (provided by source): \`<%= version %>\`.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).
`
)
