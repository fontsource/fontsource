# Contributing to Fontsource

Thanks for supporting Fontsource!

> Please note that this project is released with a [Contributor Code of Conduct](https://github.com/fontsource/fontsource/blob/main/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

- [Contributing to Fontsource](#contributing-to-fontsource)
  - [Questions](#questions)
  - [Issues and Pull Requests](#issues-and-pull-requests)
    - [Submitting an Issue](#submitting-an-issue)
    - [Submitting a Pull Request (PR)](#submitting-a-pull-request-pr)
  - [Development](#development)
    - [Useful Scripts](#useful-scripts)
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
- [mass-publish](https://github.com/fontsource/mass-publish) for publishing packages.
- [Jest](https://jestjs.io/) for testing.
- [Fastify NestJS](https://nestjs.com/) for the API architecture.
- [Next.js](https://nextjs.org/) and [Chakra UI](https://chakra-ui.com/) for the website.

After cloning the repo, run:

```shell
yarn
```

The project uses Yarn Workspaces, thus the packager, API and website should install in one command.

### Useful Scripts

- `yarn test` - Runs tests.
- `yarn format` - Runs Prettier and dprint across the repository.
- `yarn format:scripts` - Runs Prettier only over the `scripts` directory.
- `yarn format:fonts` - Runs dprint on the `fonts` directory.
- `yarn lint` - Runs ESLint over the `scripts` directory.

### Packager Development

More details can be found in the [README.md](https://github.com/fontsource/fontsource/tree/main/scripts#readme) of the `scripts` directory.

### Website Development

More details can be found in the [README.md](https://github.com/fontsource/fontsource/tree/main/website#readme) of the `website` directory.

## Submit Documentation

Submitting new or updating documentation for the Fontsource website is painless and doesn't necessarily require much setup. Navigating to [`website/docs`](https://github.com/fontsource/fontsource/tree/main/website/docs) should contain a directory of markdown files. Editing those markdown files will reflect onto the website.

Please note when submitting brand new pages, it would be required to update [`website/src/configs/docsList.json`](https://github.com/fontsource/fontsource/blob/main/website/src/configs/docsList.json) appropriately for it to reflect on the website sidebar.
