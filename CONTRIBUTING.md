# Contributing to Fontsource

Thanks for supporting Fontsource!

> Please note that this project is released with a [Contributor Code of Conduct](https://github.com/fontsource/fontsource/blob/main/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

- [Contributing to Fontsource](#contributing-to-fontsource)
  - [Questions](#questions)
  - [Issues and Pull Requests](#issues-and-pull-requests)
    - [Submitting an Issue](#submitting-an-issue)
    - [Submitting a Pull Request (PR)](#submitting-a-pull-request-pr)
  - [Development](#development)
    - [Packager Development](#packager-development)
      - [Generic](#generic)
      - [Google](#google)
      - [Templates](#templates)
      - [Utils](#utils)
      - [Useful Scripts](#useful-scripts)
    - [Website Development](#website-development)
  - [Submit Documentation](#submit-documentation)

## Questions

For general support or questions, please make a [Discussion](https://github.com/fontsource/fontsource/discussions/new) instead. Issues should be used for bug reports or feature and font requests.

## Issues and Pull Requests

### Submitting an Issue

Before you submit an issue, please search the issue tracker to prevent duplicates as existing discussion might inform you of workarounds readily available.

For fixing bugs, we need to have the necessary information to reproduce and confirm it. At minimum we would expect device, browser and 3rd-party library usage information, however, it may be necessary to provide a minimal reproducible build for us to reproduce the error. Lack of information may lead to the issue being closed.

You can file issues by filling out an [issue form](https://github.com/fontsource/fontsource/issues/new/choose).

### Submitting a Pull Request (PR)

1. Before you submit a PR, please search the repository for an open or closed PR that relates to your submission.
2. Fork the fontsource/fontsource repository (click the <kbd>Fork</kbd> button at the top right of this page).
3. Clone the repository locally before creating your own branch.

   ```shell
   git clone https://github.com/fontsource/fontsource.git
   git checkout -b my-pr-branch main
   ```

4. Create your patch or feature addition, **including appropriate test cases in the tests directory**.
5. Ensure all tests and lints pass.
6. On GitHub, send a pull request to fontsource:main.
   - If we suggest changes then:
     - Make the required updates.
     - Re-run the test suites to ensure tests are still passing.
     - Rebase your branch and force push to your GitHub repository (this will update your PR):
     ```shell
     git rebase main -i
     git push -f
     ```
7. After your pull request is merged, you can safely delete your branch and pull changes from the main repository.

## Development

Fontsource is built completely with Typescript which extends to both the API and website.

- [Google Font Metadata](https://github.com/fontsource/google-font-metadata) as the upstream source of Google Fonts data.
- [mass-publish](https://github.com/fontsource/mass-publish) for publishing packages.
- [Jest](https://jestjs.io/) for testing.
- [Fastify NestJS](https://nestjs.com/) for the API architecture.
- [Next.js](https://nextjs.org/) and [Chakra UI](https://chakra-ui.com/) for the website.

After cloning the repo, run:

```shell
yarn
```

The project uses Yarn Workspaces, thus the packager, API and website should install in one command.

To run tests after making any changes to the project, run:

```shell
yarn test
```

### Packager Development

Found in `scripts`, this is the foundation of the project that generates the font packages in the `packages` directory.

#### Generic

`scripts/generic` contains all the files relevant to the "generic packager" of Fontsource. In other words, it relates to generating packages for all non-Google fonts that have to be manually added.

`yarn build:generic` - Calls `build.ts` and runs the Generic Packager on `scripts/generic/files`.

`yarn build:generic-force` - Calls `rebuilder.ts` and rebuilds ALL non-Google fonts with the Generic Packager. Useful when the generic packager is updated and makes changes that needs to be applied to all other fonts.

More details on how to use the generic packager can be found in [`scripts/generic/README.md`](https://github.com/fontsource/fontsource/blob/main/scripts/generic/README.md).

#### Google

`scripts/google` contains all the files relevant to download and package all Google Fonts.

`yarn build:google` - Runs `download-google.ts`. Compares metadata from [Google Font Metadata](https://github.com/fontsource/google-font-metadata) parsers and existing metadata, only updating those that differ.
`yarn build:google-force` Forcefully redownload and repackage all Google Font packages.

Please note it is generally not recommended for you to run these commands locally and you would be better off relying on `yarn test` to ensure everything is in working order. If you wish to properly build the repo locally, check out our Github Actions workflows `manual-run.yml` and `manual-run-force.yml` which shows the necessary precursor steps to generate current metadata using Google Font Metadata before actually generating the packages.

Additionally, [`download-google.ts`](https://github.com/fontsource/fontsource/blob/main/scripts/google/download-google.ts#L40) can be temporarily adjusted to only build a smaller dataset of fonts when testing to save on build times. Comment out `production()` and uncomment the `development()` function. This really shouldn't be used unless we can't test something with written tests.

#### Templates

`scripts/templates` holds all the Lodash template files that is used to generate CSS, SCSS and Markdown files. If you want to modify any generated content, such as an SCSS mixin, this is the section that needs to be modified.

#### Utils

Other than holding some utility functions used in other scripts, `scripts/utils` also has additional scripts that can be manually run or called in CI to work on the repo.

`yarn util:algolia` - Runs `algolia-index.ts` that updates the Algolia search index used on the website.

`yarn util:fontlist` - Runs `fontlist-generator.ts` that generates `FONTLIST.json` and `FONTLIST.md`.

`yarn util:package-json-rebuild` - Runs `package-json-rebuild.ts` that regenerates the package.json files of all font packages to a new template. This is needed because all build functions will never touch any package.json fields, thus if any additional fields need to be updated, this script must be used.

`yarn util:subsets` - Runs `subset-list.ts` and outputs a list of all subsets present in the repo by reading all metadata files.

#### Useful Scripts

`yarn format` - Runs Prettier and dprint across the directory.
`yarn format:scripts` - Runs Prettier only over the `scripts` directory.
`yarn format:packages` - Runs dprint on the `packages` directory.
`yarn lint` - Runs ESLint over the `scripts` directory.

### Website Development

More details can be found in the [README.md](https://github.com/fontsource/fontsource/tree/main/website#readme) of the `website` directory.

## Submit Documentation

Submitting new or updating documentation for the Fontsource website is painless and doesn't necessarily require much setup. Navigating to [`website/docs`](https://github.com/fontsource/fontsource/tree/main/website/docs) should contain a directory of markdown files. Editing those markdown files will reflect onto the website.

Please note when submitting brand new pages, it would be required to update [`website/src/configs/docsList.json`](https://github.com/fontsource/fontsource/blob/main/website/src/configs/docsList.json) appropriately for it to reflect on the website sidebar.
