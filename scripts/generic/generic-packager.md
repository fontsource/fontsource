# Generic Font Packager

This is a basic explanation on how to utilize this section of the repo to easily generate the CSS files for fonts that are not part of the Google Fonts directory.

## Usage

1. Fork this repo, run `yarn` to install dependencies and create a new `files` folder, shown in directory order `scripts/generic/files`.

2. Place all woff and woff2 files within this files directory and it **must** be in the filename format as specified:

   1. `<fontid>-<subset>-<weight>-<style>.extension`
   2. We do not support anything other than woff and woff2. We expect both file formats.

3. Open `config.js` located in this directory and enter the fontid, font name and an optional unicode range if you are aware of it for performance benefits.

4. Note `<fontid>` will be used for filename purposes and therefore it must be:

   1. All lowercase
   2. Spaces must be substituted with dashes if applicable

5. On the other hand, `<font name>` is what will be publicly described on the top of readme files and can use uppercase/titlecase as well as have spaces in between.

6. Within the main directory, run `yarn build:generic`. This will generate a folder in `scripts/generic` using the fontid as the folder name.

7. You must then enter the new package folder and edit `README.md` with references to the correct subsets, weights, styles, licenses and attributions to the font you are packaging for. Add any specific notes too!

8. Once ready, just copy over the new package folder over to the main packages directory. Create a pull request, it'll be reviewed and added to the repository!

## Tools

You are also able to run `yarn util:renamer` to rename all files in the `files` directory to lowercase, as well as replace any font weights in word format, to numbers. Note that this isn't stable and is prone to accidental replacements. Use with caution.
