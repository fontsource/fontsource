# Fontsource API Worker

This is the current Fontsource API and CDN worker. It serves font metadata and
artifacts, builds missing packages, and collects download stats.

## How it fits together

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
cd api/worker
bun run dev
```

Useful checks:

```sh
bun run test
bun run typecheck
bun run build
```

## Stats resources

Before the first stats deployment to a new Cloudflare account, create the D1
database and Queue:

```sh
bun x wrangler d1 create fontsource-stats
bun x wrangler queues create fontsource-stats
```

Copy the D1 UUID into the `STATS` binding in `wrangler.toml`, then apply the
migration:

```sh
bun x wrangler d1 migrations apply STATS --remote
```

The Queue consumer, Durable Object, and Container are configured when the
worker is deployed. They do not need separate setup commands. The KV and R2
bindings point to existing Fontsource resources.

## Scheduled refreshes

Metadata refreshes every three hours. Download stats are refreshed every Sunday
at 00:15 UTC. The stats schedule queues one job per active package; the Queue
consumer does the slower provider requests in the background.

To trigger the stats schedule locally:

```sh
bun x wrangler dev --test-scheduled
```

In another terminal:

```sh
curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=15+0+*+*+SUN&format=json"
```

This uses local bindings and does not touch production data. Remote development
can use live bindings, so only run the same trigger with `--remote` when you
intend to enqueue a full production refresh. Wait for the Queue to drain before
triggering it again.
