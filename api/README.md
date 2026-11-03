# Fontsource API Worker

This is the current Fontsource API built on Cloudflare Workers. It serves font metadata and artifacts, builds missing packages, and collects download stats.

## Bindings

| Cloudflare service | What it does here |
| --- | --- |
| Workers | Handles API requests, scheduled refreshes, and queue messages. |
| Workers Cache | Keeps cacheable responses close to callers. |
| KV (`METADATA`) | Stores the font catalog, axis registry, and public metadata. |
| R2 (`FONTS`) | Stores generated font files and package archives. |
| R2 (`REGISTRY`) | Stores registry snapshots and original source fonts. |
| D1 (`STATS`) | Stores incremental npm and jsDelivr download history. |
| Queues (`STATS_QUEUE`) | Spreads stats refreshes across small, retryable package jobs. |
| Durable Objects (`ARTIFACT_BUILDER`) | Coordinates package builds so the same artifact is not built twice. |
| Containers | Build packages and upload the finished artifacts to R2. |

The bindings and schedules live in [`wrangler.toml`](./wrangler.toml).

## Development

Install dependencies from the repository root, then start the worker:

```sh
pnpm install
cd api
pnpm dev
```

Useful checks:

```sh
pnpm test
pnpm typecheck
pnpm build
```

### V6 package output manifests

CSS and font-file routes for package major versions 6 and later read the exact
npm version's `manifest.json` through jsDelivr. The manifest supplies real faces,
formats, coverage, and ordered CSS entrypoints; these routes do not infer V6
outputs from the legacy catalog. Static desktop conversions still decode the
published WOFF2 bytes through the existing artifact builder.

Version 5 keeps its existing catalog path. A missing, invalid, or unavailable V6
manifest fails explicitly rather than falling back to guessed outputs. Pinned
binary objects already in R2 keep their existing fast path and cache behavior.
The catalog-backed listing and ZIP download endpoints are unchanged; migrating
those consumers remains part of the Font Files/catalog rollout.

### Published packages

`GET /v1/packages` reads `metadata/published.json` from Font Files through the
existing KV metadata refresh. It contains only verified static/variable package
versions. Merge the Font Files producer and its initial index before deploying
this consumer. Failed refreshes preserve the stored index.

`GET /v1/packages/:id/:kind/:version` reads an exact V6 package's manifest and
frozen registry metadata (`kind` is `static` or `variable`). It does not depend on
the index: the producer uses this endpoint to verify output before promoting it.
Registry membership describes source availability, not npm publication.
