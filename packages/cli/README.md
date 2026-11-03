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

Downloads completed web assets from the Registry API and assembles packages.
Requires Node.js 22 or newer. The fonts are not rebuilt during download.

```bash
fontsource build noto-sans-math stix-two-math --out /tmp/fontsource-packages
```

Files are checksum-verified. Static and variable packages use the same prepared
source build. `--out` must be a new directory; failures leave no partial packages.
Use `--registry-url <url>` to select another API origin.

## `fontsource build-local`

Builds from original registry sources using Core. Use this for local character or
OpenType feature customization instead of trying to restore features removed
from prepared web fonts.

```bash
fontsource build-local noto-sans-math stix-two-math \
  --inputs /tmp/fontsource-inputs --out /tmp/fontsource-packages
```

`--inputs` stores one frozen registry snapshot and its hash-verified source files.
`--out` must be a new directory. Repeat with the same inputs and another output
path to build offline. Use a new input directory to choose another revision or
additional families. Optional `--revision <commit>` selects the registry revision;
`--registry-url <url>` selects another API origin (defaults to
`https://api.fontsource.org`). The API must support pinned registry reads.

`--text <text>` restricts characters. `--features ss01,smcp` retains selected
OpenType features in addition to the standard defaults; a leading minus removes
a feature, for example `--features=ss01,-dlig`. These options affect local output
only, not official API/CDN assets.

The build writes `static/<id>` and `variable/<id>` packages with WOFF2 fonts,
CSS entrypoints, the original license, and registry metadata. Root CSS covers all
declared character sets at the default weight/style. Full-repertoire fonts omit
`unicode-range`. Partial output is discarded on failure; existing output is never
overwritten. Building does not publish or upload anything.

For local development, run `pnpm --dir packages/core build`, then
`pnpm --dir packages/cli cli build-local ...` with the same arguments.

## Release and migration

This is a breaking CLI release: `build` downloads prepared registry assets and
requires family IDs and `--out`. Source processing is available through
`build-local`, which also requires `--inputs`. The Google metadata `fetch` command,
library exports, browser entrypoint, and CommonJS build are removed. This package
is now a Node CLI; CSS-only consumers use `@fontsource-utils/core/css`. Custom
submission commands remain available.

New source-built font packages start at `6.0.0`. They use registry metadata and
WOFF2. They retain `scss/metadata.scss` for `@fontsource-utils/scss`, a changelog
redirect, and the publisher hash. Legacy metadata, `unicode.json`, WOFF, and
package-local Sass mixins are not generated.

### Published output manifest

Each generated package includes `manifest.json` with schema version 1, the family
name and source modification date, actual resolved faces, and CSS entrypoints
referencing ordered face indexes. The CDN uses this exact-version output for V6
CSS and font-file selection, including full-font coverage and numbered slices.
The manifest describes built outputs; `metadata.json` retains registry metadata.

## License

MIT
