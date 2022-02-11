# Fontsource Scripts

This is the foundation of the project that generates the font packages in the `packages` directory.

## Generic

`scripts/generic` contains all the files relevant to the "generic packager" of Fontsource. In other words, it relates to generating packages for all non-Google fonts that have to be manually added.

- `yarn build:generic` - Calls `build.ts` and runs the Generic Packager on `scripts/generic/files`.

- `yarn build:generic-force` - Calls `rebuilder.ts` and rebuilds ALL non-Google fonts with the Generic Packager. Useful when the generic packager is updated and makes changes that needs to be applied to all other fonts.

More details on how to use the generic packager can be found in [`scripts/generic/README.md`](https://github.com/fontsource/fontsource/blob/main/scripts/generic/README.md).

## Google

`scripts/google` contains all the files relevant to download and package all Google Fonts.

- `yarn build:google` - Runs `download-google.ts`. Compares metadata from [Google Font Metadata](https://github.com/fontsource/google-font-metadata) parsers and existing metadata, only updating those that differ.
- `yarn build:google-force` - Forcefully redownload and repackage all Google Font packages.

Please note it is generally not recommended for you to run these commands locally and you would be better off relying on `yarn test` to ensure everything is in working order. If you wish to properly build the repo locally, check out our Github Actions workflows `manual-run.yml` and `manual-run-force.yml` which shows the necessary precursor steps to generate current metadata using Google Font Metadata before actually generating the packages.

Additionally, [`download-google.ts`](https://github.com/fontsource/fontsource/blob/main/scripts/google/download-google.ts#L40) can be temporarily adjusted to only build a smaller dataset of fonts when testing to save on build times. Comment out `production()` and uncomment the `development()` function. This really shouldn't be used unless we can't test something with written tests.

## Templates

`scripts/templates` holds all the Lodash template files that is used to generate CSS, SCSS and Markdown files. If you want to modify any generated content, such as an SCSS mixin, this is the section that needs to be modified.

## Utils

Other than holding some utility functions used in other scripts, `scripts/utils` also has additional scripts that can be manually run or called in CI to work on the repo.

- `yarn util:algolia` - Runs `algolia-index.ts` that updates the Algolia search index used on the website.

- `yarn util:fontlist` - Runs `fontlist-generator.ts` that generates `FONTLIST.json` and `FONTLIST.md`.

- `yarn util:package-json-rebuild` - Runs `package-json-rebuild.ts` that regenerates the package.json files of all font packages to a new template. This is needed because all build functions will never touch any package.json fields, thus if any additional fields need to be updated, this script must be used.

- `yarn util:subsets` - Runs `subset-list.ts` and outputs a list of all subsets present in the repo by reading all metadata files.
