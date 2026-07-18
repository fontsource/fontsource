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
    - [Website Development](#website-development)
  - [Package Releases](#package-releases)
  - [Submit Documentation](#submit-documentation)

## Questions

For general support or questions, please make a [Discussion](https://github.com/fontsource/fontsource/discussions/new) instead. Issues should be used for bug reports or feature and font requests.

## Issues and Pull Requests

### Submitting an Issue

Before submitting an issue, search the issue tracker for existing reports and available workarounds.

Bug reports should include enough information to reproduce the problem, including the device, browser, and third-party libraries involved. A minimal reproduction may also be required. Reports without enough information may be closed.

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
5. Use a [Conventional Commit](https://www.conventionalcommits.org/) pull request title. Release Please uses the squashed title to prepare package releases.
6. Ensure all tests and checks pass.
7. On GitHub, open a pull request against `fontsource/fontsource`'s `main` branch.

    If we request changes:

    - Make the requested updates.
    - Re-run the relevant checks.
    - Rebase your branch and update the pull request:

      ```shell
      git rebase -i main
      git push --force-with-lease
      ```

8. After your pull request is merged, you can safely delete your branch and pull changes from the main repository.

## Development

Fontsource is a Node.js and TypeScript monorepo. The pinned Node.js and pnpm versions are available through [mise](https://mise.jdx.dev/).

```shell
mise install
pnpm install
```

The project uses pnpm workspaces, so package tooling, the API, and the website install together.

### Useful Scripts

-   `pnpm check` - Checks formatting and lint rules.
-   `pnpm typecheck` - Typechecks every workspace.
-   `pnpm test` - Runs tests.
-   `pnpm build` - Builds every workspace that defines a build.
-   `pnpm ci` - Runs the complete local validation sequence.

### Website Development

More details can be found in the [README.md](https://github.com/fontsource/fontsource/tree/main/website#readme) of the `website` directory.

## Package Releases

Release Please maintains one release pull request for the public packages under `packages/`. Merging that pull request creates package-scoped tags and publishes only the versions selected by Release Please. Package versions remain independent.

Use `fix` for patch releases, `feat` for minor releases, and `!` for breaking changes in pull request titles. Changes under `api` and `website` are private and are not published to npm.

Maintainer setup for the release workflow:

-   Install a GitHub App on `fontsource` and `font-files` with repository contents, issue, and pull-request permissions. Store its credentials as `RELEASE_APP_ID` and `RELEASE_APP_PRIVATE_KEY` repository secrets.
-   Protect the `npm` GitHub environment and configure npm trusted publishing for `.github/workflows/ci.yml` on each public package.
-   Publish `@fontsource-utils/core@0.1.0` once with a maintainer token before enabling its trusted publisher; npm requires a package to exist before trusted publishing can be configured.
-   Require the `Quality`, `Packages`, `API`, and `Website` checks on `main`, and squash merge with a Conventional Commit title so Release Please can classify the release.

## Submit Documentation

Website documentation lives under [`website/docs`](https://github.com/fontsource/fontsource/tree/main/website/docs). Edit the relevant Markdown file and preview the website locally when practical.

When adding a page, also update the nearest [`meta.json`](https://github.com/fontsource/fontsource/blob/main/website/docs/meta.json) so it appears in the documentation sidebar.
