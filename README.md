# Fontsource

[![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/DecliningLotus/fontsource) [![License](https://badgen.net/badge/license/MIT/green)](https://github.com/DecliningLotus/fontsource/blob/master/LICENSE) [![GitHub stars](https://img.shields.io/github/stars/DecliningLotus/fontsource.svg?style=social&label=Star)](https://GitHub.com/DecliningLotus/fontsource/stargazers/)

An updating monorepo full of self-hostable Open Source fonts bundled into individual NPM packages!
Inspired by the aging [Typefaces](https://github.com/KyleAMathews/typefaces) project and primarily built using [Google Font Metadata](https://github.com/fontsource/google-font-metadata),

Our supported font list can be found [here](https://github.com/DecliningLotus/fontsource/blob/master/FONTLIST.md).

## About

- Self-hosting brings _significant performance gains_ as typically loading fonts from hosted font services, such as Google Fonts, lead to an extra (render blocking) network request. To provide perspective, for simple websites it has been seen to _double_ visual load times. Benchmarks can be found [here](https://github.com/HTTPArchive/almanac.httparchive.org/pull/607) and [here](https://github.com/reactiflux/reactiflux.com/pull/21).

- Fonts remain _version locked_. Google often pushes updates to their fonts [without notice](https://github.com/google/fonts/issues/1307), which may interfere with your live production projects. Manage your fonts like any other NPM dependency.

- Your _fonts load offline_. Often there may be situations, like working in an airplane or train, leaving you stranded without access to your online hosted fonts. Have the ability to keep working under any circumstance.

- _Support for fonts outside the Google Font ecosystem_. This repository is constantly evolving with other Open Source fonts. Feel free to contribute!

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

This is an installation example using Open Sans, applicable to all other fonts searchable via NPM or the packages directory.

```javascript
yarn add fontsource-open-sans // npm install fontsource-open-sans
```

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (`layout.js`), page component, or `gatsby-browser.js`. In CRA, add the line to the `index.js` file.

```javascript
import "fontsource-open-sans" // Defaults to weight 400 with all styles included.
```

Fontsource allows you to select weights and even individual styles, allowing you to cut down on payload sizes to the last byte! Utilizing the CSS unicode-range selector, all language subsets are accounted for.

```javascript
import "fontsource-open-sans/500.css" // All styles included.
import "fontsource-open-sans/900-normal.css" // Select either normal or italic.
```

Alternatively, the same solutions could be imported via SCSS!

```scss
@import "~fontsource-open-sans/index.css";
@import "~fontsource-open-sans/300-italic.css";
```

_Do confirm on Google Fonts (or elsewhere) whether your font supports a certain subset, weight or style beforehand as these examples may not reflect actual compatibility._

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "Open Sans";
}
```

## Additional Options

In the rare case you need to individually select a language subset and not utilize the CSS unicode-range selector, you may specify the import as follows. This is especially not recommended for languages, such as Japanese, with a large amount of characters.

```javascript
import "fontsource-open-sans/latin-ext.css" // All weights and styles included.
import "fontsource-open-sans/cyrillic-ext-500.css" // All styles included.
import "fontsource-open-sans/greek-900-normal.css" // Select either normal or italic.
```

_Examples above may not reflect actual variant availability._

## Migrating from 2.x to 3.x

See [CHANGELOG.md](https://github.com/fontsource/fontsource/blob/master/CHANGELOG.md) for more details.

## Adding New Fonts

For Open Source fonts that are not automatically updated by the Google ecosystem, we have a generic packager that builds CSS files for you. Click [here](https://github.com/DecliningLotus/fontsource/blob/master/scripts/generic/generic-packager.md) to see how to use it.

Otherwise, make a request by creating an [issue](https://github.com/DecliningLotus/fontsource/issues)!

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

You can find their specific licenses on each package `README.md`.

## Other Notes

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/DecliningLotus/fontsource/issues).
