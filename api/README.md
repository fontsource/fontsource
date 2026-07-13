# Fontsource API Worker

This is the current Fontsource API built on Cloudflare Workers. It serves font metadata and artifacts, builds missing packages, and collects download stats.

## Bindings

| Cloudflare service | What it does here |
| --- | --- |
| Workers | Handles API requests, scheduled refreshes, and queue messages. |
| Workers Cache | Keeps cacheable responses close to callers. |
| KV (`METADATA`) | Stores the font catalog, axis registry, and public metadata. |
| R2 (`FONTS`) | Stores generated font files and package archives. |
| D1 (`STATS`) | Stores incremental npm and jsDelivr download history. |
| Queues (`STATS_QUEUE`) | Spreads stats refreshes across small, retryable package jobs. |
| Durable Objects (`ARTIFACT_BUILDER`) | Coordinates package builds so the same artifact is not built twice. |
| Containers | Build packages and upload the finished artifacts to R2. |

The bindings and schedules live in [`wrangler.toml`](./wrangler.toml).

## Development

Install dependencies from the repository root, then start the worker:

```sh
bun install
cd api
bun run dev
```

Useful checks:

```sh
bun run test
bun run typecheck
bun run build
```
