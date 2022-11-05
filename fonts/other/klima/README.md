# Fontsource Klima

[![npm (scoped)](https://img.shields.io/npm/v/@fontsource/klima?color=brightgreen)](https://www.npmjs.com/package/@fontsource/klima) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/@fontsource/klima)](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/@fontsource/klima)](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “Klima” font. Please visit the main [Fontsource website](https://fontsource.org/fonts/klima) to view more details on this package.

## Quick Installation

Fontsource has a variety of methods to import CSS, such as using a bundler like Webpack. Alternatively, it supports SASS. Full documentation can be found [here](https://fontsource.org/docs/introduction).

```javascript
yarn add @fontsource/klima // npm install @fontsource/klima
```

Within your app entry file or site component, import it in.

```javascript
import "@fontsource/klima"; // Defaults to weight 400.
```

Supported variables:

- Weights: `[200,300,400,500,700,900,950]`
- Styles: `[italic,normal]`
- Supported subsets: `[latin]`

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "Klima";
}
```

## Licensing

Available under a Creative Commons Non-Commercial Reuse license. You may not use the fonts for commercial purposes without explicit prior written authorization.

Font [Source](https://wehtt.am/fonts/) and [License](https://creativecommons.org/licenses/by-nc-nd/4.0/).

## Other Notes

Font version (provided by source): `2018`.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).
