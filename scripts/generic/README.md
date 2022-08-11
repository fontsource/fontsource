# Generic Font Packager

This is a basic explanation on how to utilize this section of the repo to easily generate the CSS files for fonts that are not part of the Google Fonts directory.

## Usage

1. Fork this repo, run `pnpm i` in the main directory to install dependencies

1. Create a new `files` folder matching this filepath: `./scripts/generic/files`.

1. Place all `woff` and `woff2`- files of the chosen font within this files directory and it **must** be in the filename format as specified:

   1. `<fontid>-<subset>-<weight>-<style>.extension` - Example `abeezee-latin-400-normal.woff2`
   1. We do not support anything other than woff and woff2. We expect both file formats.
   1. The packager will infer how many subsets, weights and styles are in the font depending on how many files there are with different names.
   1. [Example](https://github.com/fontsource/fontsource/tree/main/packages/open-sans/files)
   1. A very useful tool is PowerRename from the [PowerToys](https://github.com/microsoft/PowerToys) kit for Windows.

1. Open `./scripts/generic/config.js` and enter the relevant details.

1. Note `<fontid>` will be used for filename purposes and therefore it must be:

   1. All lowercase
   2. Spaces must be substituted with dashes if applicable

1. On the other hand, `<font name>` is what will be publicly described on the top of readme files and can use uppercase/titlecase as well as have spaces in between.

1. Within the main directory, run `pnpm build:generic`. This will generate a folder in `scripts/generic` using the fontid as the folder name.

1. Review `README.md` to ensure everything is correct and linked appropriately.

1. Once ready, copy over the new package folder found in `./scripts/generic` over to the main packages directory, `./fonts/generic`. Make sure to delete the generated files in `./scripts/generic`. Create a pull request, it'll be reviewed and added to the repository!

## Tools

You are also able to run `pnpm util:renamer` to rename all files in the `files` directory to lowercase, as well as replace any font weights in word format, to numbers. Note that this isn't stable and is prone to accidental replacements. Use with caution.
