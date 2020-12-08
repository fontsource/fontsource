# Fontsource Roboto Mono

[![npm version](https://badge.fury.io/js/fontsource-roboto-mono.svg)](https://www.npmjs.com/package/fontsource-roboto-mono) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/fontsource-roboto-mono)](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/fontsource-roboto-mono)](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/DecliningLotus/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “Roboto Mono” font. Please visit the main [Fontsource monorepo](https://github.com/fontsource/fontsource) to view more details on this package.

## Installation

Fontsource assumes you are using a bundler, such as Webpack, to load in CSS. Solutions like [CRA](https://create-react-app.dev/), [Gatsby](https://www.gatsbyjs.org/) and [Next.js](https://nextjs.org/) are prebuilt examples that are compatible.

```javascript
yarn add fontsource-roboto-mono // npm install fontsource-roboto-mono
```

Then within your app entry file or site component, import it in. For example in Gatsby, you could choose to import it into a layout template (`layout.js`), page component (`index.js`), or `gatsby-browser.js`.

```javascript
import "fontsource-roboto-mono" // Defaults to weight 400 with all styles included.
```

Fontsource allows you to select weights and even individual styles, allowing you to cut down on payload sizes to the last byte! Utilizing the CSS unicode-range selector, all language subsets are accounted for.

```javascript
import "fontsource-roboto-mono/500.css" // All styles included.
import "fontsource-roboto-mono/900-normal.css" // Select either normal or italic.
```

Alternatively, the same solutions could be imported via SCSS!

```scss
@import "~fontsource-roboto-mono/index.css";
@import "~fontsource-roboto-mono/300-italic.css";
```

_These examples may not reflect actual compatibility. Please refer below._

Supported variables:

- Weights: `[100,200,300,400,500,600,700]`
- Styles: `[italic,normal]`

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "Roboto Mono";
}
```

## Variable Fonts

This particular typeface supports [variable fonts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide).

Begin by importing both the variable and fallback font for non-compatible browsers.

```js
import "fontsource-roboto-mono/400.css" // Weight 400
```

Select either a stripped down weights only variant of the font or a full feature variant that contains all the variable axes.

```js
import "fontsource-roboto-mono/variable.css" // Contains ONLY variable weights and no other axes. Both normal and italic.
import "fontsource-roboto-mono/variable-normal.css" // Normal variant.
import "fontsource-roboto-mono/variable-italic.css" // Italic variant.
// Or
import "fontsource-roboto-mono/variable-full.css" // This contains ALL variable axes. Font files are larger. Both normal and italic.
import "fontsource-roboto-mono/variable-full-normal.css" // Normal variant.
import "fontsource-roboto-mono/variable-full-italic.css" // Italic variant.
```

Note a `full` or `italic` variant may NOT exist if there are no additional axes other than weight.

Followed by the CSS using the @supports tag, which checks whether the browser is capable of utilising variable fonts. Fallback fonts and their relevant CSS should be used outside the block, whilst all variable options should be used within the @supports block and utilising the font-variation-settings tag.

```css
h1 {
  font-family: Roboto Mono;
  font-weight: 400;
}

@supports (font-variation-settings: normal) {
  h1 {
    font-family: Roboto MonoVariable;
    font-variation-settings: "wght" 400;
  }
}
```

_To view the available variable axes that may be included in the font, click [here](https://fonts.google.com/variablefonts). The meanings of all axes and the restrictions associated with them are explained there._

## Additional Options

In the rare case you need to individually select a language subset and not utilize the CSS unicode-range selector, you may specify the import as follows. This is especially not recommended for languages, such as Japanese, with a large amount of characters.

```javascript
import "fontsource-roboto-mono/latin-ext.css" // All weights and styles included.
import "fontsource-roboto-mono/cyrillic-ext-500.css" // All styles included.
import "fontsource-roboto-mono/greek-900-normal.css" // Select either normal or italic.
```

- Supported subsets: `[cyrillic,cyrillic-ext,greek,latin,latin-ext,vietnamese]`

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

[Google Fonts License Attributions](https://fonts.google.com/attribution)

## Other Notes

Font version (provided by source): `v12`.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).
