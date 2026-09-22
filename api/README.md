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

## Error tracking

Production builds report unexpected request errors and scheduled/queue failures to
the website's PostHog project, tagged `source: api-worker`. Expected HTTP 4xx
responses are excluded; Cloudflare logging and queue retries remain in place.

Set `POSTHOG_API_KEY` in the API's Cloudflare build environment to upload source
maps to PostHog during `pnpm build`, using the same personal API key permissions
as the website build. Maps are removed after upload. `WORKERS_CI_COMMIT_SHA`
(or `GITHUB_SHA`) identifies the release in captured errors. Local development
and tests do not send errors.
