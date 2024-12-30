# Fontsource SCSS

This is a helper library to use [Fontsource](https://fontsource.org) with SCSS.

## Installation

```bash
npm install @fontsource-utils/scss
```

## Usage

Import the mixins and relevant font metadata into your project. In this example, we will use "Recursive" as the font family.

```scss
// Recommended: Use NodePackageImporter().
@use "pkg:@fontsource-utils/scss" as fontsource;
@use "pkg:@fontsource-variable/recursive" as recursive;

// Direct import: The path to `node_modules` can be DIFFERENT in your project.
@use "../node_modules/@fontsource-utils/src/mixins.scss" as fontsource;
@use "../node_modules/@fontsource-variable/recursive/scss/metadata.scss" as recursive;
```

- `pkg` import reference: [`sass-lang.com`](https://sass-lang.com/documentation/at-rules/use/#pkg-ur-ls)

Afterwards, you can use the `faces` mixin to generate the `@font-face` rules.

```scss
@include fontsource.faces($metadata: recursive.$metadata);
```

You can learn more about the mixins and variables in the [Fontsource SCSS documentation](https://fontsource.org/docs/getting-started/sass-import).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
