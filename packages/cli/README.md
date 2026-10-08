# Fontsource CLI

The Fontsource CLI builds self-hostable font packages from the Fontsource Registry and supports custom package submissions.

## Getting Started

```bash
npm install @fontsource-utils/cli
```

# Commands

## `fontsource create`

Builds a new fontsource package from a template for submission. 

### Usage

```bash
npx fontsource create
```

## `fontsource create-verify`

Verifies that a fontsource package is valid and ready for submission.

### Usage

```bash
npx fontsource create-verify [options]
```

### Options

| Option     | Description                               | Default              |
| ---------- | ----------------------------------------- | -------------------- |
| `-i, --id` | Directory to verify package e.g. `./[id]` | Prompts user instead |
| `--ci`     | Disables fancy prompts                    | `false`              |
| `--cwd`    | Sets the current working directory        | `process.cwd()`      |

## `fontsource build`

Builds fonts from Registry API sources using Core. Requires Node.js 22 or newer.

```bash
fontsource build noto-sans-math stix-two-math \
  --inputs /tmp/fontsource-inputs --out /tmp/fontsource-packages
```

`--inputs` stores one frozen registry snapshot and its hash-verified source files.
`--out` must be a new directory. Repeat with the same inputs and another output
path to build offline. Use a new input directory to choose another revision or
additional families. Optional `--revision <commit>` selects the registry revision;
`--registry-url <url>` selects another API origin (defaults to
`https://api.fontsource.org`). The API must support pinned registry reads.

The build writes `static/<id>` and `variable/<id>` packages with WOFF2 fonts,
CSS entrypoints, the original license, and registry metadata. Root CSS covers all
declared character sets at the default weight/style. Full-repertoire fonts omit
`unicode-range`. Partial output is discarded on failure; existing output is never
overwritten. Building does not publish or upload anything.

For local development, run `pnpm --dir packages/core build`, then
`pnpm --dir packages/cli cli build ...` with the same arguments.

## Release and migration

This is a breaking CLI release: `build` now uses registry sources and requires
explicit family IDs, `--inputs`, and `--out`. The Google metadata `fetch` command,
library exports, browser entrypoint, and CommonJS build are removed. This package
is now a Node CLI; CSS-only consumers use `@fontsource-utils/core/css`. Custom
submission commands remain available.

New source-built font packages start at `6.0.0`. They use registry metadata and
WOFF2; legacy metadata, WOFF and SCSS output are not part of this generator.

## License

MIT
