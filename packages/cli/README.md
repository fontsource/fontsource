# Fontsource CLI

The Fontsource CLI allows users to build fontsource packages locally as well as create new packages for submissions. For metadata, it uses [Google Font Metadata](https://github.com/fontsource/google-font-metadata).

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

## License

MIT
