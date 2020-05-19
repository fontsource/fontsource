# Fontsource

An updating monorepo rebuilt off of its predecessor [Typefaces](https://github.com/KyleAMathews/typefaces), full of self-hostable Open Source fonts bundled into individual NPM packages!

## About

- Self-hosting brings _significant performance gains_ as typically loading fonts from hosted font services, such as Google Fonts, lead to an extra (render blocking) network request. To provide perspective, for simple websites it has been seen to _double_ visual load times. Benchmarks can be found [here](https://github.com/HTTPArchive/almanac.httparchive.org/pull/607) and [here](https://github.com/reactiflux/reactiflux.com/pull/21).

- Fonts remain _version locked_. Google often pushes updates to their fonts without notice, which may interfere with your live production projects. Manage your fonts like any other NPM dependency.

- Your _fonts load offline_. Often there may be situations, like working in an airplane or train, leaving you stranded without access to your online hosted fonts. Have the ability to keep working under any circumstance.

- _Support for fonts outside the Google Font ecosystem_. This repository is constantly evolving with other Open Source fonts. Feel free to contribute!

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Tools like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt example solutions that are compatible.

This is an installation example using Open Sans, applicable to all other fonts searchable via NPM or the packages directory.

```javascript
yarn add fontsource-open-sans //npm install fontsource-open-sans
```

Then within your app entry file or site component, import it in. For example in Gatsby, you could simply import it into your `layout.js` component or `gatsby-browser.js` for limited circumstances.

```javascript
import "fontsource-open-sans" //require("fontsource-open-sans")
```

Fontsource allows you to select font subsets, weights and even individual styles, allowing you to cut down on payload sizes to the last byte! The default selection above, however, sticks to the Latin subset including all weights and styles.

```javascript
import "fontsource-open-sans/latin-ext.css" // All weights and styles included.
import "fontsource-open-sans/cyrillic-ext-400.css" // All styles included.
import "fontsource-open-sans/greek-700-normal.css" // Select either normal or italic.
```

Alternatively, the same solutions could be imported via SCSS!

```scss
@import "~fontsource-open-sans/index";
@import "~fontsource-open-sans/vietnamese-300-italic";
```

_Do confirm on Google Fonts (or elsewhere) whether your font supports a certain subset, weight or style beforehand as these examples may not reflect actual compatibility._

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

[Google Fonts License Attributions](https://fonts.google.com/attribution)

## Other Notes

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/DecliningLotus/fontsource/issues).
