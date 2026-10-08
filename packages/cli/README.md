# Fontsource CLI

The Fontsource CLI allows users to build fontsource packages locally as well as create new packages for submissions. For metadata, it uses [Google Font Metadata](https://github.com/fontsource/google-font-metadata).

## Getting Started

```bash
npm install @fontsource-utils/cli google-font-metadata
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

## `fontsource fetch`

Fetches the latest metadata from Google Fonts.

### Usage

```bash
npx fontsource fetch [key] [options]
```

- Key is the Google Fonts API key. If not provided, it will be read from the environment variable `GOOGLE_API_KEY`.

### Options

| Option        | Description                            | Default |
| ------------- | -------------------------------------- | ------- |
| `-f, --force` | Force parse all metadata without cache | `false` |


## `fontsource build`

Builds all Google Fonts packages from the metadata generated from `fontsource fetch`.

### Usage

```bash
npx fontsource build [...fonts] [options]
```

- Fonts is a list of font ids to build. If not provided, it will build all fonts.

### Options

| Option        | Description                                     | Default |
| ------------- | ----------------------------------------------- | ------- |
| `-f, --force` | Force rebuild all packages from scratch         | `false` |
| `-t, --test`  | Generate a small number of packages for testing | `false` |
| `--ttf`       | Download TTF/OTF font files                     | `false` |

## License

MIT

## Local v6 builds (internal)

The v6 preview builds archived TTF/OTF sources through Core, using the Registry
API's explicit distribution targets and character definitions. It does not read
Google Font Metadata or use the v5 publishing pipeline.

```bash
pnpm --dir packages/core build
pnpm --dir packages/cli v6:build noto-sans-math stix-two-math \
  --registry-url http://localhost:8787 \
  --inputs /tmp/fontsource-v6-inputs --out /tmp/fontsource-v6-packages
```

The API must support `X-Registry-Revision` and pinned metadata reads. The first
response selects the revision; `--revision <registry-commit>` can select one
explicitly. All subsequent metadata uses that revision. Only distributed source
files are downloaded, and their SHA-256 and sizes are checked.

Repeat with the same `--inputs` and a new `--out` directory to build offline.
Frozen metadata and verified source bytes are reused without network requests;
use a new input directory to select another revision or additional families.
Paths are relative to `packages/cli`; absolute paths avoid ambiguity.

Outputs are private `6.0.0-dev.0` packages under `static/<id>` and `variable/<id>`.
They contain WOFF2 files, CSS entrypoints, the source license, and registry
metadata. Existing output directories are never overwritten, and failed builds
do not leave a completed package directory. Root CSS includes every distributed
subset at the default weight/style; full-repertoire fonts omit `unicode-range`.
These are local previews, not v5 drop-in replacements: WOFF, SCSS helpers and the
old metadata schema are outside this first slice. Existing v5 commands and
published packages are unchanged. Nothing publishes or uploads these outputs.
