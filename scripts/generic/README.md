# Generic Font Packager

This is a basic explanation on how to utilize this section of the repo to easily generate the CSS files for fonts that are not part of the Google Fonts directory.

## Usage

1. Fork this repo, run `yarn` in the main directory to install dependencies and create a new `files` folder matching this filepath `./scripts/generic/files`.

2. Place all woff and woff2 files of the chosen font within this files directory and it **must** be in the filename format as specified:

   1. `<fontid>-<subset>-<weight>-<style>.extension` - Example `abeezee-latin-400-normal.woff2`
   2. We do not support anything other than woff and woff2. We expect both file formats.
   3. The packager will infer how many subsets, weights and styles are in the font depending on how many files there are with different names.
   4. [Example](https://github.com/fontsource/fontsource/tree/main/packages/open-sans/files)

3. Open `config.js` located in this directory and enter the relevant details.

4. Note `<fontid>` will be used for filename purposes and therefore it must be:

   1. All lowercase
   2. Spaces must be substituted with dashes if applicable

5. On the other hand, `<font name>` is what will be publicly described on the top of readme files and can use uppercase/titlecase as well as have spaces in between.

6. Within the main directory, run `yarn build:generic`. This will generate a folder in `scripts/generic` using the fontid as the folder name.

7. Review `README.md` to ensure everything is correct and linked appropriately.

8. Once ready, copy over the new package folder found in `./scripts/generic` over to the main packages directory, `./packages/`. Make sure to delete the generated files in `./scripts/generic`. Create a pull request, it'll be reviewed and added to the repository!

## Tools

You are also able to run `yarn util:renamer` to rename all files in the `files` directory to lowercase, as well as replace any font weights in word format, to numbers. Note that this isn't stable and is prone to accidental replacements. Use with caution.
