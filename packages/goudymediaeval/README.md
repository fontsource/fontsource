# Fontsource Goudy Mediaeval
[![npm version](https://badge.fury.io/js/fontsource-goudymediaeval.svg)](https://www.npmjs.com/package/fontsource-goudymediaeval) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/DecliningLotus/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/fontsource-goudymediaeval)](https://github.com/DecliningLotus/fontsource) [![Total downloads](https://badgen.net/npm/dt/fontsource-goudymediaeval)](https://github.com/DecliningLotus/fontsource) [![GitHub stars](https://img.shields.io/github/stars/DecliningLotus/fontsource.svg?style=social&label=Star)](https://GitHub.com/DecliningLotus/fontsource/stargazers/)

The CSS and web font files to easily self-host the “Goudy Mediaeval” font. Please visit the main [Fontsource monorepo](https://github.com/DecliningLotus/fontsource) to view more details on this package.

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

```javascript
yarn add fontsource-goudymediaeval // npm install fontsource-goudymediaeval
```

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (`layout.js`), page component, or `gatsby-browser.js`.

```javascript
import "fontsource-goudymediaeval" // require("fontsource-goudymediaeval")
```

Fontsource allows you to select font subsets, weights and even individual styles, allowing you to cut down on payload sizes to the last byte! The default selection above, however, sticks to the Latin subset including all weights and styles.

```javascript
import "fontsource-goudymediaeval/latin-ext.css" // All weights and styles included.
import "fontsource-goudymediaeval/cyrillic-ext-400.css" // All styles included.
import "fontsource-goudymediaeval/greek-700-normal.css" // Select either normal or italic.
```

Alternatively, the same solutions could be imported via SCSS!

```scss
@import "~fontsource-goudymediaeval/index.css";
@import "~fontsource-goudymediaeval/vietnamese-300-italic.css";
```

_These examples may not reflect actual compatibility. Please refer below._

Supported variables:
- Subsets: `[]`
- Weights: `[400]`
- Styles: `[regular]`

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "Goudy Mediaeval";
}
```

## Licensing 

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

Font [Source](https://www.onlinewebfonts.com/download/24b2eac64e0cb26cc8851d7fdf940b88) and [License](http://moorstation.org/typoasis/designers/steffmann/index.htm).

## Other Notes

Font version (provided by source): ``.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/DecliningLotus/fontsource/issues).

