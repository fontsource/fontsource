# Fontsource API

This project features a REST API that allows developers to pull metadata and download files directly.

Refer to the [docs](https://fontsource.org/docs/api/introduction) for more info.

The rest of the README is for developers.

## Installation

```bash
$ pnpm run install
```

### Setup Environment variables

This is only needed for local development using a `.env` file.

```
MONGO_DB_DEV=mongodb_url
```

## Running the app

```bash
# development
$ pnpm run start`

# watch mode
$ pnpm run start:dev

```

## Test

TODO: Still need to write all the tests necessary

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e
```
