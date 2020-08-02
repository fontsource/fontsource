# Changelog

Fontsource will log all notable changes within this file.

#### Patch (0.0.x)

These occur when an automatic update is pushed from a source, such as Google, or Fontsource may apply patches. Due to version mismatching and lack of accurate tracking, a specific version for a Fontsource patch cannot be logged. Fixes are mentioned in each minor update instead.

# 3.x Release

## 3.0.x

### BREAKING CHANGES

`import fontsource-<font name>` or `index.css` no longer defaults to contain ALL weights and styles for a font. It now only contains weight 400 with all styles included. This was changed to prevent fonts, such as Noto Sans JP, to counter-intuitively generate 1MB+ CSS files with the new unicode-range feature.

Simply choose the necessary weights and styles from now on with `import fontsource-<font name>/<weight>.css` or `import fontsource-<font name>/<weight>-<style>.css`.

### Features

- Added unicode-range CSS selector to all fonts. It is no longer necessary for individual subsets to be defined when importing CSS files but backwards compatability remains. Use `import fontsource-<font name>/<weight>.css` or `import fontsource-<font name>/<weight>-<style>.css` to leverage the new feature from now on. [#37](https://github.com/fontsource/fontsource/pull/37)
- Adjusted template.js to add more repository information to package.json. [#37](https://github.com/fontsource/fontsource/pull/37)

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
