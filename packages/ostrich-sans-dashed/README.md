# Fontsource Ostrich Sans Dashed

[![npm version](https://badge.fury.io/js/fontsource-ostrich-sans-dashed.svg)](https://www.npmjs.com/package/fontsource-ostrich-sans-dashed) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/fontsource-ostrich-sans-dashed)](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/fontsource-ostrich-sans-dashed)](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “Ostrich Sans Dashed” font. Please visit the main [Fontsource monorepo](https://github.com/fontsource/fontsource) to view more details on this package.

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

```javascript
yarn add fontsource-ostrich-sans-dashed // npm install fontsource-ostrich-sans-dashed
```

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (`layout.js`), page component, or `gatsby-browser.js`.

```javascript
import "fontsource-ostrich-sans-dashed" // Defaults to weight 400 with all styles included.
```

Fontsource allows you to select font subsets, weights and even individual styles, allowing you to cut down on payload sizes to the last byte! The default selection above, however, sticks to the Latin subset including all weights and styles.

```javascript
import "fontsource-ostrich-sans-dashed/latin-ext.css" // All weights and styles included.
import "fontsource-ostrich-sans-dashed/cyrillic-ext-400.css" // All styles included.
import "fontsource-ostrich-sans-dashed/greek-700-normal.css" // Select either normal or italic.
```

Alternatively, the same solutions could be imported via SCSS!

```scss
@import "~fontsource-ostrich-sans-dashed/index.css";
@import "~fontsource-ostrich-sans-dashed/vietnamese-300-italic.css";
```

_These examples may not reflect actual compatibility. Please refer below._

Supported variables:

- Subsets: `[latin]`
- Weights: `[500]`
- Styles: `[normal]`

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "Ostrich Sans Dashed";
}
```

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

Font [Source](https://github.com/theleagueof/ostrich-sans) and [License](https://github.com/theleagueof/ostrich-sans/blob/master/Open%20Font%20License.markdown).

## Other Notes

Font version (provided by source): `v13`.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).
