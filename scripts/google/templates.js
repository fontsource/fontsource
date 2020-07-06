const _ = require(`lodash`)

exports.packageJson = _.template(
  `{
  "name": "fontsource-<%= fontId %>",
  "version": "1.0.0",
  "description": "<%= fontName %> font in NPM glory.",
  "main": "index.css",
  "keywords": [
    "fontsource",
    "font",
    "font family",
    "google fonts",
    "<%= fontName %>",
    "<%= fontId %>",
    "css",
    "front-end",
    "web"
  ],
  "author": "Lotus <declininglotus@gmail.com>",
  "license": "MIT",
  "repository": "https://github.com/DecliningLotus/fontsource/tree/master/packages/<%= fontId %>"
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
  src:<% _.each(locals, function(localName) { %>
    local('<%= localName %>'),<% });
    %> 
    url('<%= woff2Path %>') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
    url('<%= woffPath %>') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
`
)

exports.readme = _.template(
  `# Fontsource <%= fontName %>
[![npm version](https://badge.fury.io/js/fontsource-<%= fontId %>.svg)](https://www.npmjs.com/package/fontsource-<%= fontId %>) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/DecliningLotus/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/fontsource-<%= fontId %>)](https://github.com/DecliningLotus/fontsource) [![Total downloads](https://badgen.net/npm/dt/fontsource-<%= fontId %>)](https://github.com/DecliningLotus/fontsource) [![GitHub stars](https://img.shields.io/github/stars/DecliningLotus/fontsource.svg?style=social&label=Star)](https://GitHub.com/DecliningLotus/fontsource/stargazers/)

The CSS and web font files to easily self-host the “<%= fontName %>” font. Please visit the main [Fontsource monorepo](https://github.com/DecliningLotus/fontsource) to view more details on this package.

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

\`\`\`javascript
yarn add fontsource-<%= fontId %> // npm install fontsource-<%= fontId %>
\`\`\`

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (\`layout.js\`), page component, or \`gatsby-browser.js\`.

\`\`\`javascript
import "fontsource-<%= fontId %>" // require("fontsource-<%= fontId %>")
\`\`\`

Fontsource allows you to select font subsets, weights and even individual styles, allowing you to cut down on payload sizes to the last byte! The default selection above, however, sticks to the Latin subset including all weights and styles.

\`\`\`javascript
import "fontsource-<%= fontId %>/latin-ext.css" // All weights and styles included.
import "fontsource-<%= fontId %>/cyrillic-ext-400.css" // All styles included.
import "fontsource-<%= fontId %>/greek-700-normal.css" // Select either normal or italic.
\`\`\`

Alternatively, the same solutions could be imported via SCSS!

\`\`\`scss
@import "~fontsource-<%= fontId %>/index.css";
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

[Google Fonts License Attributions](https://fonts.google.com/attribution)

## Other Notes

Font version (provided by source): \`<%= version %>\`.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/DecliningLotus/fontsource/issues).

`
)
