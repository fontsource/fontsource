# Changelog

Fontsource will log all notable changes within this file.

#### Patch (0.0.x)

These occur when an automatic update is pushed from a source, such as Google, or Fontsource may apply patches. Due to version mismatching and lack of accurate tracking, a specific version for a Fontsource patch cannot be logged into the changelog. Note that Google may push [breaking changes](https://github.com/google/fonts/issues/1307) on their end to individual fonts which Fontsource cannot predict for.

#### Minor (0.x.x)

These will always contain changes from Fontsource's end.

# 4.x Release

## 4.2.x

### Features

- Added default variables to SCSS mixins. [#144](https://github.com/fontsource/fontsource/pull/144)
- Added $fontDir variable to SCSS mixins. [#146](https://github.com/fontsource/fontsource/pull/146)
- Added variable font support and $defSubset variable to SCSS mixins. [#147](https://github.com/fontsource/fontsource/pull/147)

### Documentation

- Changed package.json descriptions to something more mature. [#148](https://github.com/fontsource/fontsource/pull/148)

## 4.1.x

### Features

- Added customisable SASS support through mixins for more flexible user setups. [#64](https://github.com/fontsource/fontsource/issues/64) [#122](https://github.com/fontsource/fontsource/pull/122)

### Fixes

- Major refactor to organise the templates and generic packager. [#120](https://github.com/fontsource/fontsource/pull/120)

## 4.0.x

### BREAKING CHANGES

- Package names have been renamed from `fontsource-<font name>` to the safer, more authentic scoped format `@fontsource/<font name>`.
  That means all packages will need to be reinstalled with `yarn add @fontsource/<font name>` or `npm install @fontsource/<font name>` with imports updated to the new package such as `import @fontsource/open-sans/400-italic.css`. [#108](https://github.com/fontsource/fontsource/issues/108)

- `import @fontsource/<font name>/<weight>.css` now only contains normal style variants of fonts. The `-normal.css` files throughout the respository have been removed. Importing italic variants remain the same via `import @fontsource/<font name>/<weight>-italic.css`.
  Please see [#88](https://github.com/fontsource/fontsource/issues/88) for more details. [#112](https://github.com/fontsource/fontsource/pull/112)

### Features

- All non-Google fonts now have weight specific files that match 3.0.x as they previously were only importable via subsets. Simply use as normal with `import @fontsource/<font name>/<weight>.css`. [#92](https://github.com/fontsource/fontsource/issues/92) [#115](https://github.com/fontsource/fontsource/pull/115)

### Fixes

- Add publishConfig to package.json templates for scoped packages to successfully publish. [#118](https://github.com/fontsource/fontsource/pull/118)
- Generate index.css for fonts that do not have weight 400. [#119](https://github.com/fontsource/fontsource/pull/119)

# 3.x Release

## 3.1.x

### Features

- Initial variable font support for Google Fonts. Supported fonts can be found [here](https://fonts.google.com/variablefonts) with their package README's explaining installation instructions. [#103](https://github.com/fontsource/fontsource/pull/103)

### Fixes

- Resolve incorrect filename generation for oblique/slnt variable fonts. [#106](https://github.com/fontsource/fontsource/pull/106) [#109](https://github.com/fontsource/fontsource/pull/109)
- Prevent full variant variable CSS files to be generated for fonts that do not have any extra axes. [#110](https://github.com/fontsource/fontsource/pull/110)

## 3.0.x

### BREAKING CHANGES

- `import fontsource-<font name>` or `index.css` no longer defaults to contain ALL weights and styles for a font. It now only contains weight 400 with all styles included. This was changed to prevent fonts, such as Noto Sans JP, to counter-intuitively generate 1MB+ CSS files with the new unicode-range feature.
  Simply choose the necessary weights and styles from now on with `import fontsource-<font name>/<weight>.css` or `import fontsource-<font name>/<weight>-<style>.css`. [#37](https://github.com/fontsource/fontsource/pull/37) [#42](https://github.com/fontsource/fontsource/pull/42)

- TTF/OTF support has been removed due to NPM package size limitations. Browser compatability goes as low as: [caniuse](https://caniuse.com/#feat=woff) [#44](https://github.com/fontsource/fontsource/pull/44)

### Features

- Added unicode-range CSS selector to all fonts. It is no longer necessary for individual subsets to be defined when importing CSS files but backwards compatability remains. Use `import fontsource-<font name>/<weight>.css` or `import fontsource-<font name>/<weight>-<style>.css` to leverage the new feature from now on. [#37](https://github.com/fontsource/fontsource/pull/37)
- Added package.json rebuilder. [#43](https://github.com/fontsource/fontsource/pull/43)
- Added force rebuild to Google packages. [#37](https://github.com/fontsource/fontsource/pull/37)
- Added force rebuild to non-Google packages. [#42](https://github.com/fontsource/fontsource/pull/42)
- Autogenerate `FONTLIST.md` and added `FONTLIST.json`. [#58](https://github.com/fontsource/fontsource/pull/58)
- Copy `CHANGELOG.md` to every individual package. [#41](https://github.com/fontsource/fontsource/pull/41)

### Fixes

- Adjusted templates.js to add more relevant fields to package.json [#37](https://github.com/fontsource/fontsource/pull/37)
- Resolved subsets not correctly being identified when packaging files through the generic packager. [#45](https://github.com/fontsource/fontsource/pull/45)

# 2.x Release

## 2.2.x

### Features

- Added TTF/OTF support for every package for older browser compatability. [#33](https://github.com/fontsource/fontsource/pull/33)
- Refactored entire API source from [majodev/google-webfonts-helper](https://github.com/majodev/google-webfonts-helper) to [fontsource/google-font-metadata](https://github.com/fontsource/google-font-metadata) for future expandability. [#33](https://github.com/fontsource/fontsource/pull/33)

### Fixes

- Add Yarn resolution to resolve Lerna publish errors. [f6e7b1f](https://github.com/fontsource/fontsource/commit/f6e7b1f08639d1e3c17a52e485ef24fb9980b5d9)

## 2.1.x

### Features

- Added metadata.json files to each package that contains useful data that allows Fontsource or external users to leverage to pull information from. [#26](https://github.com/fontsource/fontsource/pull/26) [#27](https://github.com/fontsource/fontsource/pull/27) [#28](https://github.com/fontsource/fontsource/pull/28)
- Account for rare possible instance of oblique font-style [#26](https://github.com/fontsource/fontsource/pull/26)

### Fixes

- Correct src: locals() in CSS generation to reflect upstream source accurately. [#10](https://github.com/fontsource/fontsource/pull/10) [#11](https://github.com/fontsource/fontsource/pull/11)
- Resolve incorrect SCSS documentation + general improvements [#23](https://github.com/fontsource/fontsource/pull/23)
- Ensure no old files remain from a font update [#24](https://github.com/fontsource/fontsource/pull/24)
- Allow index.css generation for fonts without latin subset [#25](https://github.com/fontsource/fontsource/pull/25)

## 2.0.x

- Main release.
