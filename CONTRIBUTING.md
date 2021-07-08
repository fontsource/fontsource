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
- [Lerna](https://github.com/lerna/lerna) for publishing packages.
- [Jest](https://jestjs.io/) for testing.
- [Fastify NestJS](https://nestjs.com/) for the API architecture.
- [Next.js](https://nextjs.org/) and [Chakra UI](https://chakra-ui.com/) for the website.

After cloning the repo, run:

```shell
yarn
```

The main root, API and website directories each have separate package.json setups and scripts. Thus requiring `yarn` to be run in each directory.

### Packager Development

`yarn format` - Runs Prettier and ESLint across the directory.
`yarn format:scripts` - Runs Prettier only over the `./scripts` directory.
`yarn format:eslint` - Runs ESLint only.

`yarn build:generic` - Runs the Generic Packager on `./scripts/generic/files`.
`yarn build:generic-force` - Rebuilds ALL non-Google fonts with the Generic Packager. Useful when the generic packager is updated and makes changes that needs to be applied to all other fonts.

`yarn build:google` - Runs the Google Packager. Compares metadata from Google Font Metadata parsers (see commands below) and existing metadata, only updating those that differ.
`yarn build:google-force` Forcefully redownload and repackage all Google Font packages.

Additionally, [`./scripts/google/download-google.ts`](https://github.com/fontsource/fontsource/blob/main/scripts/google/download-google.ts#L40) can be temporarily adjusted to only build a smaller dataset of fonts when testing to save on build times. Comment out `production()` and uncomment the `development()` function.

`yarn parser:v1` + `yarn parser:v2` + `yarn parser:variable` - Runs [Google Font Metadata](https://github.com/fontsource/google-font-metadata) scripts that parse the Google APIs that Fontsource needs. In production, these scripts MUST be run before building.

### Website Development

More details can be found on the [README.md](https://github.com/fontsource/fontsource/tree/main/website#readme) of `./website`.

## Submit Documentation

Submitting new or updating documentation for the Fontsource website is painless and doesn't necessarily require much setup. Navigating to [`./website/docs`](https://github.com/fontsource/fontsource/tree/main/website/docs) should contain a directory of markdown files. Editing those markdown files will reflect onto the website.

Please note when submitting brand new pages, it would be required to update [`./website/src/configs/docsList.json`](https://github.com/fontsource/fontsource/blob/main/website/src/configs/docsList.json) appropriately for it to reflect on the website sidebar.
