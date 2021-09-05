# Fontsource

[![Generic badge](https://img.shields.io/badge/fontsource-passing-brightgreen)](https://github.com/fontsource/fontsource) [![codecov](https://codecov.io/gh/fontsource/fontsource/branch/main/graph/badge.svg?token=QEJJF3SE62)](https://codecov.io/gh/fontsource/fontsource) [![Monthly Downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Ffontsource%2Fdownload-stat-aggregator%2Fmaster%2Fdata%2FbadgeMonth.json)](https://github.com/fontsource/download-stat-aggregator) [![Total Downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Ffontsource%2Fdownload-stat-aggregator%2Fmaster%2Fdata%2FbadgeTotal.json)](https://github.com/fontsource/download-stat-aggregator) [![License](https://badgen.net/badge/license/MIT/green)](https://github.com/fontsource/fontsource/blob/main/LICENSE) [![GitHub stars](https://img.shields.io/github/stars/fontsource/fontsource.svg?style=social&label=Star)](https://github.com/fontsource/fontsource/stargazers)

An updating monorepo full of self-hostable Open Source fonts bundled into individual NPM packages!

Our full documentation and search directory can be found [here](https://fontsource.org/).
[https://fontsource.org/](https://fontsource.org/)

Alternatively, you can see the list of supported fonts in Markdown format [here](https://github.com/fontsource/fontsource/blob/main/FONTLIST.md).

##

- Self-hosting brings **significant performance gains** as loading fonts from hosted services, such as Google Fonts, lead to an extra (render blocking) network request. To provide perspective, for simple websites it has been seen to _double_ visual load times.
  Benchmarks can be found [here](https://github.com/HTTPArchive/almanac.httparchive.org/pull/607) and [here](https://github.com/reactiflux/reactiflux.com/pull/21).

- Fonts remain **version locked**. Google often pushes updates to their fonts [without notice](https://github.com/google/fonts/issues/1307), which may interfere with your live production projects. Manage your fonts like any other NPM dependency.

- Commit to **privacy**. Google does track the usage of their fonts and for those who are extremely privacy concerned, self-hosting is an alternative.

- Your **fonts load offline**. On top of benefiting PWAs, often there may be situations, like working in an airplane or train, leaving you stranded without access to your online hosted fonts. Have the ability to keep working under any circumstance.

- **Support for fonts outside the Google Font ecosystem**. This repository is constantly evolving with [other Open Source fonts](https://github.com/fontsource/fontsource/blob/main/FONTLIST.md). Feel free to contribute!

## API

Check out the documentation [here](https://fontsource.org/docs/api/introduction).

## Migrating from previous versions

See [CHANGELOG.md](https://github.com/fontsource/fontsource/blob/main/CHANGELOG.md) for more details.

## Adding New Fonts

For Open Source fonts that are not automatically updated by the Google ecosystem, we have a generic packager that builds CSS files for the project.

Make a request by creating an [issue](https://github.com/fontsource/fontsource/issues)!

## Licensing

It is important to always read the license for every font that you use.
Most of the fonts in the collection use the SIL Open Font License, v1.1. Some fonts use the Apache 2 license. The Ubuntu fonts use the Ubuntu Font License v1.0.

You can find their specific licenses on each package `README.md`.

## Other Notes

Feel free to star and contribute new ideas to this repository that aim to improve the performance of font loading, as well as expanding the existing library we already have. Any suggestions or ideas can be voiced via an [issue](https://github.com/fontsource/fontsource/issues).

[![Vercel Banner](https://www.datocms-assets.com/31049/1618983297-powered-by-vercel.svg)](https://vercel.com/?utm_source=fontsource&utm_campaign=oss)
