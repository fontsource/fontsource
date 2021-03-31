# Fontsource FiraGO

[![npm (scoped)](https://img.shields.io/npm/v/@fontsource/firago?color=brightgreen)](https://www.npmjs.com/package/@fontsource/firago) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/@fontsource/firago)](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/@fontsource/firago)](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “FiraGO” font. Please visit the main [Fontsource monorepo](https://github.com/fontsource/fontsource) to view more details on this package.

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

```javascript
yarn add @fontsource/firago // npm install @fontsource/firago
```

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (`layout.js`), page component (`index.js`), or `gatsby-browser.js`.

```javascript
import "@fontsource/firago" // Defaults to weight 400.
```

Fontsource allows you to select weights and even individual styles, allowing you to cut down on payload sizes to the last byte! Utilizing the CSS unicode-range selector, all language subsets are accounted for.

```javascript
import "@fontsource/firago/500.css" // Weight 500.
import "@fontsource/firago/900-italic.css" // Italic variant.
```

Alternatively, the same solutions could be imported via SCSS!

```scss
@import "~@fontsource/firago/index.css"; // Weight 400.
@import "~@fontsource/firago/300-italic.css";
```

For more advanced setups, you can use our highly customisable Sass mixins that can modify many of the existing @font-face variables.

```scss
@use "@fontsource/firago/scss/mixins" as FiraGO;

// Fully customisable single @font-face mixin.
@include FiraGO.fontFaceCustom(
  $weight: 600,
  $display: optional,
  $woff2Path: "#{$fontDir}/custom-file.woff2",
  $unicodeRange: false
);
```

For those not using Dart Sass, you can still use @import although it can be highly problematic as variables are placed in the global scope which can conflict with existing Sass setups. It's highly recommended to migrate to Dart Sass as all other versions have been deprecated.

```scss
@import "~@fontsource/firago/scss/mixins";

// Fully customisable single @font-face mixin.
@include fontFaceCustom(
  $weight: 600,
  $display: optional,
  $woff2Path: "#{$fontDir}/custom-file.woff2",
  $unicodeRange: false
);
```

You can see all of the existing inputtable mixin variables [here](https://github.com/fontsource/fontsource/tree/master/packages/firago/scss/mixins.scss).

_These examples may not reflect actual compatibility. Please refer below._

Supported variables:

- Weights: `[100,200,300,400,500,600,700,800,900]`
- Styles: `[italic,normal]`

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "FiraGO";
}
```



## Additional Options

In the rare case you need to individually select a language subset and not utilize the CSS unicode-range selector, you may specify the import as follows. This is especially not recommended for languages, such as Japanese, with a large amount of characters.

```javascript
import "@fontsource/firago/latin-ext.css" // All weights with normal style included.
import "@fontsource/firago/cyrillic-ext-500.css" // Weight 500 with normal style.
import "@fontsource/firago/greek-900-italic.css" // Italic variant.
```

- Supported subsets: `[all]`

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

Font [Source](https://github.com/bBoxType/FiraGO) and [License](https://github.com/bBoxType/FiraGO/blob/master/OFL.txt).

## Other Notes

Font version (provided by source): `1.001`.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).
