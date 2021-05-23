# Fontsource Fira Mono

[![npm (scoped)](https://img.shields.io/npm/v/@fontsource/fira-mono?color=brightgreen)](https://www.npmjs.com/package/@fontsource/fira-mono) [![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![Monthly downloads](https://badgen.net/npm/dm/@fontsource/fira-mono)](https://github.com/fontsource/fontsource) [![Total downloads](https://badgen.net/npm/dt/@fontsource/fira-mono)](https://github.com/fontsource/fontsource) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

The CSS and web font files to easily self-host the “Fira Mono” font. Please visit the main [Fontsource website](https://fontsource.org/fonts/fira-mono) to view more details on this package.

## Quick Installation

Fontsource has a variety of methods to import CSS, such as using a bundler like Webpack. Alternatively, it supports SASS. Full documentation can be found [here](https://fontsource.org/docs/introduction).

```javascript
yarn add @fontsource/fira-mono // npm install @fontsource/fira-mono
```

Within your app entry file or site component, import it in.

```javascript
import "@fontsource/fira-mono"; // Defaults to weight 400.
```

Supported variables:

- Weights: `[400,500,700]`
- Styles: `[normal]`
- Supported subsets: `[cyrillic,cyrillic-ext,greek,greek-ext,latin,latin-ext]`

Finally, you can reference the font name in a CSS stylesheet, CSS Module, or CSS-in-JS.

```css
body {
  font-family: "Fira Mono";
}
```

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

[Google Fonts License Attributions](https://fonts.google.com/attribution)

## Other Notes

Font version (provided by source): `v9`.

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).
