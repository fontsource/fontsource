# @fontsource-utils/core

A low-level utility library for processing font files for the Fontsource ecosystem.

## Installation

```bash
pnpm add @fontsource-utils/core
```

## Features

- **Web-optimized font generation**: Convert TTF/OTF fonts to WOFF2 and WOFF formats
- **Font subsetting**: Generate subsets based on Unicode ranges or character sets
- **CSS generation**: Automatically generate CSS files with proper `@font-face` declarations
- **Slicing support**: Handle large fonts by splitting them into smaller chunks

## Standalone CSS generation

Import `@fontsource-utils/core/css` to generate CSS without loading the font
processing or WASM modules. It accepts resolved faces from a build or a versioned
artifact manifest; it does not fetch registry data, inspect binaries, or infer
filenames from subset names.

```ts
import { generateCSS, type FontFace } from '@fontsource-utils/core/css';

const faces: FontFace[] = [{
  subset: 'math',
  weight: 400,
  style: 'normal',
  isVariable: false,
  sliceIndex: 0,
  unicodeRange: 'U+2190-2300',
  sources: [{ format: 'woff2', filename: 'example-math-400-normal.woff2' }],
}];

const css = generateCSS('Example Math', faces, {
  display: 'swap',
  resolver: ({ source }) => `https://example.com/fonts/v1/${source.filename}`,
});
```

`generateCSS` renders the supplied faces in order as one stylesheet. Select
faces before calling it; it never expands weights, styles, axes, or subsets into
additional faces. Without a resolver, URLs use `./files/<filename>`.

`generateCSSAssets(family, faces, options)` applies the existing package
entrypoint rules to produce files such as `400.css`, `math.css`, and `index.css`.
For variable packages, pass `options.variable` with the axis definitions so the
generator can select the default `index.css` entrypoint.

Both functions preserve each face's Unicode range. An empty `unicodeRange`
deliberately omits the descriptor for an unrestricted face; it does not default
to Latin. Callers must supply coverage matching the referenced artifact.

`buildFont()` returns resolved `faces` and package `css`. Render those faces
directly when different CSS output is needed. Metadata-based callers first use
`resolveFontFaces(config, axisKeys?)` to plan filenames and select variable
bundles, then pass the result to either generator. Axis selections use distinct,
case-sensitive metadata tags: omitted means all bundles, an empty list means none.
Rendering options only control display, URL resolution and minification; they
never select additional faces.

CSS serialization, face planning, and package entrypoints live in
`@fontsource-utils/core/css`. The CLI and registry previews use the same typed
`renderFontFaceRule` renderer. It takes a final family, style, weight, optional
stretch, ordered `{ url, format }` sources, and an explicit `unicodeRange`
(string or `null` for unrestricted coverage). Set `isVariable` to append the
`Variable` family suffix; an existing suffix is preserved. Source formats are
CSS hints such as `woff2`, `woff2-variations`, `truetype`, or `opentype`.

Rendering uses single-quoted family names, bare URLs and bare standard format
hints. Callers supply trusted URLs already safe for unquoted CSS. Legacy variation hints remain quoted. Supported formats are enforced by
TypeScript; a small local serializer escapes quotes, backslashes and line breaks.
`{ minify: true }` produces compact CSS directly, including through `generateCSS`
and the asset generators. The CLI bundles this pure entrypoint
into its browser and CommonJS builds without loading font-processing modules.
Google metadata adapters preserve its explicit source variants and only emit
formats selected by the downloader. Missing legacy coverage is passed as
`null`; the renderer does not invent a Unicode range.

CSS output is covered by readable snapshots. Review changes to declarations,
Unicode ranges, filenames, and entrypoints before updating a snapshot; matching
a snapshot does not establish that the referenced binary has the claimed glyphs.

## License

MIT
