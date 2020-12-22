# Fontsource Material Icons

[![npm version](https://badge.fury.io/js/fontsource-material-icons.svg)](https://www.npmjs.com/package/fontsource-material-icons) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/fontsource-material-icons)](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/fontsource-material-icons)](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “Material Icons” font. Please visit the main [Fontsource monorepo](https://github.com/fontsource/fontsource) to view more details on this package.

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

```javascript
yarn add fontsource-material-icons // npm install fontsource-material-icons
```

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (`layout.js`), page component (`index.js`), or `gatsby-browser.js`.

```javascript
import "fontsource-material-icons" // Defaults to weight 400.
```

Fontsource allows you to select weights and even individual styles, allowing you to cut down on payload sizes to the last byte! Utilizing the CSS unicode-range selector, all language subsets are accounted for.

```javascript
import "fontsource-material-icons/500.css" // Weight 500.
import "fontsource-material-icons/900-italic.css" // Italic variant.
```

Alternatively, the same solutions could be imported via SCSS!

```scss
@import "~fontsource-material-icons/index.css"; // Weight 400.
@import "~fontsource-material-icons/300-italic.css";
```

_These examples may not reflect actual compatibility. Please refer below._

Supported variables:

- Weights: `[400]`
- Styles: `[normal]`

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "Material Icons";
}
```

## Additional Options

In the rare case you need to individually select a language subset and not utilize the CSS unicode-range selector, you may specify the import as follows. This is especially not recommended for languages, such as Japanese, with a large amount of characters.

```javascript
import "fontsource-material-icons/latin-ext.css" // All weights with normal style included.
import "fontsource-material-icons/cyrillic-ext-500.css" // Weight 500 with normal style.
import "fontsource-material-icons/greek-900-normal.css" // Italic variant.
```

- Supported subsets: `[base,outlined]`

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

Font [Source](https://github.com/google/material-design-icons) and [License](https://github.com/google/material-design-icons/blob/master/LICENSE).

## Other Notes

Font version (provided by source): `3.0.1`.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).
