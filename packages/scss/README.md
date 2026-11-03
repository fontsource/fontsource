# Fontsource SCSS

This is a helper library to use [Fontsource](https://fontsource.org) with SCSS.

## Installation

```bash
npm install @fontsource-utils/scss
```

## Import

Import the mixins and font metadata. This example uses the "Recursive" font family.

```scss
// Recommended: Use NodePackageImporter().
@use "pkg:@fontsource-utils/scss" as fontsource;
@use "pkg:@fontsource-variable/recursive/scss" as recursive;

// Direct import: Adjust the path to `node_modules` if necessary.
@use "../node_modules/@fontsource-utils/src/mixins.scss" as fontsource;
@use "../node_modules/@fontsource-variable/recursive/scss/metadata.scss" as recursive;
```

- `NodePackageImporter()` reference: [`sass-lang.com`](https://sass-lang.com/documentation/at-rules/use/#pkg-ur-ls)

### Usage

Use the `faces` mixin to generate `@font-face` rules:

```scss
@include fontsource.faces($metadata: recursive.$metadata);
```

For v6 packages, the default matches the package's `index.css`. Selections use
only faces present in the package; sparse weights/styles and custom axis names
are preserved. Numbered slices replace their overlapping named aggregate.
V6 packages support `woff2` only and use the exact filenames in their metadata.
Existing v5 metadata remains supported with its existing defaults.

Learn more in the [Fontsource SCSS documentation](https://fontsource.org/docs/getting-started/sass-introduction).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
