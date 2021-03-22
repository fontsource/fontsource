# Fontsource

[![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/DecliningLotus/fontsource) [![Monthly Downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Ffontsource%2Fdownload-stat-aggregator%2Fmaster%2Fdata%2FbadgeMonth.json)](https://github.com/fontsource/download-stat-aggregator) [![Total Downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Ffontsource%2Fdownload-stat-aggregator%2Fmaster%2Fdata%2FbadgeTotal.json)](https://github.com/fontsource/download-stat-aggregator) [![License](https://badgen.net/badge/license/MIT/green)](https://github.com/fontsource/fontsource/blob/master/LICENSE) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

An updating monorepo full of self-hostable Open Source fonts bundled into individual NPM packages!
Inspired by the aging [Typefaces](https://github.com/KyleAMathews/typefaces) project and primarily built using [Google Font Metadata](https://github.com/fontsource/google-font-metadata).

Our supported font search directory can be found [here](https://fontsource.github.io/search-directory/) (in very early development and may contain outdated information) or alternatively in Markdown format [here](https://github.com/fontsource/fontsource/blob/master/FONTLIST.md).

##

- Self-hosting brings _significant performance gains_ as typically loading fonts from hosted font services, such as Google Fonts, lead to an extra (render blocking) network request. To provide perspective, for simple websites it has been seen to _double_ visual load times. Benchmarks can be found [here](https://github.com/HTTPArchive/almanac.httparchive.org/pull/607) and [here](https://github.com/reactiflux/reactiflux.com/pull/21).

- Fonts remain _version locked_. Google often pushes updates to their fonts [without notice](https://github.com/google/fonts/issues/1307), which may interfere with your live production projects. Manage your fonts like any other NPM dependency.

- Your _fonts load offline_. Often there may be situations, like working in an airplane or train, leaving you stranded without access to your online hosted fonts. Have the ability to keep working under any circumstance.

- _Support for fonts outside the Google Font ecosystem_. This repository is constantly evolving with [other Open Source fonts](https://github.com/fontsource/fontsource/blob/master/FONTLIST.md). Feel free to contribute!

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

This is an installation example using Open Sans, applicable to all other fonts searchable via NPM or the packages directory.

```javascript
yarn add @fontsource/open-sans // npm install @fontsource/open-sans
```

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (`layout.js`), page component (`index.js`), or `gatsby-browser.js`.

```javascript
import "@fontsource/open-sans" // Defaults to weight 400 with normal variant.
```

Fontsource allows you to select weights and even individual styles, allowing you to cut down on payload sizes to the last byte! Utilizing the CSS unicode-range selector, all language subsets are accounted for.

```javascript
import "@fontsource/open-sans/500.css" // Weight 500.
import "@fontsource/open-sans/900-italic.css" // Italic variant.
```

Alternatively, the same solutions could be imported via SCSS!

```scss
@import "~@fontsource/open-sans/index.css";
@import "~@fontsource/open-sans/300-italic.css";
```

For more advanced setups, you can use our highly customisable Sass mixins that can modify many of the existing @font-face variables.

```scss
@use "@fontsource/open-sans/scss/mixins" as OpenSans;
@use "@fontsource/roboto/scss/mixins" as Roboto;

// Uses a unicode-range map to automatically generate multiple @font-face rules.
@include OpenSans.fontFace(
  $weight: 500,
  $display: fallback,
  $fontDir: "~@fontsource/open-sans/files"
);

// Fully customisable single @font-face mixin.
@include Roboto.fontFaceCustom(
  $weight: 600,
  $display: optional,
  $woff2Path: "#{$fontDir}/custom-file.woff2",
  $unicodeRange: false
);
```

For those not using Dart Sass, you can still use @import although it can be highly problematic as variables are placed in the global scope which can conflict with existing Sass setups. It's highly recommended to migrate to Dart Sass as all other versions have been deprecated.

```scss
@import "~@fontsource/open-sans/scss/mixins";

// Uses a unicode-range map to automatically generate multiple @font-face rules.
@include fontFace(
  $weight: 500,
  $display: fallback,
  $fontDir: "~@fontsource/open-sans/files"
);

// Fully customisable single @font-face mixin.
@include fontFaceCustom(
  $weight: 600,
  $display: optional,
  $woff2Path: "#{$fontDir}/custom-file.woff2",
  $unicodeRange: false
);
```

You can see all of the existing inputtable mixin variables [here](https://github.com/fontsource/fontsource/tree/master/packages/open-sans/scss/mixins.scss).

_Do confirm on Google Fonts (or elsewhere) whether your font supports a certain subset, weight or style beforehand as these examples may not reflect actual compatibility._

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "Open Sans";
}
```

## Variable Fonts

This repository supports variable fonts that Google Fonts provide. You can find the full list of available options [here](https://fonts.google.com/variablefonts). Instructions on how to install and use can be found on the relevant package README.

## Additional Options

In the rare case you need to individually select a language subset and not utilize the CSS unicode-range selector, you may specify the import as follows. This is especially not recommended for languages, such as Japanese, with a large amount of characters.

```javascript
import "@fontsource/open-sans/latin-ext.css" // All weights with normal style included.
import "@fontsource/open-sans/cyrillic-ext-500.css" // Weight 500 with normal style.
import "@fontsource/open-sans/greek-900-italic.css" // Italic variant.
```

_Examples above may not reflect actual variant availability._

## Migrating from previous versions

See [CHANGELOG.md](https://github.com/fontsource/fontsource/blob/master/CHANGELOG.md) for more details.

## Adding New Fonts

For Open Source fonts that are not automatically updated by the Google ecosystem, we have a generic packager that builds CSS files for the project.

Make a request by creating an [issue](https://github.com/fontsource/fontsource/issues)!

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

You can find their specific licenses on each package `README.md`.

## Other Notes

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).
