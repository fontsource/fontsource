# Fontsource API

Refer to the website for full documentation on using the API. This README is for developers wanting to locally setup the project.

## Installation

```bash
$ yarn install
```

### Setup Envirnment variables

```
MONGO_DB_DEV=mongodb_url
```

## Running the app

```bash
# development
$ yarn start`

# watch mode
$ yarn start:dev

```

## Test

TODO: Still need to write all the tests necessary

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## API

This project features a REST API that allows developers to pull metadata and download files directly.

### `GET /api/v1/fonts`

This returns an array of objects with metadata for each font.

Returns:
[{ id: fontId: fontName: … }]

### `GET /api/v1/fonts?category=sans-serif&subset=latin,latin-ext`

You can send a list of queries to filter only what metadata matches.

Returns:
[{ id: fontId: fontName: … }]

### `GET /api/v1/fonts/:id`

A more detailed set of metadata with direct download links will be returned.

Returns:
{ id: fontId: fontName: … }

### `GET /api/v1/fonts/:id/download` TODO

Returns a zip file version of the NPM package.

Returns:
Blob Zip

### `GET /api/v1/variable` TODO

Returns an array of objects that contain the variable metadata of all supported fonts.

Returns:
[{ … }]

### `GET /api/v1/variable/:id` TODO

Returns the variable metadata of a specific font.

Returns:
{ … } Variable axes info
