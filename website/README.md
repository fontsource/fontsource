# Fontsource Website

The website is a React Router and Vite application deployed to Cloudflare Workers.

## Setup

Install the monorepo from its root with `pnpm install`, then run:

```sh
cd website
pnpm dev
```

Use `pnpm typecheck`, `pnpm test`, and `pnpm build` for local validation.

## Error tracking

Production builds report browser, React Router, hydration, and server errors to
the Fontsource PostHog project through `https://a.fontsource.org`. Browser analytics
remain cookieless; server reports do not attach request headers, bodies, or query
strings and do not create person profiles. Expected client errors such as 404s and
aborted server requests are excluded.

Set `POSTHOG_API_KEY` in the website's deployment **build** environment to a PostHog
personal API key with error-tracking write access to project `280021`. The build
uploads source maps for the browser, server, and font-processing workers to EU
PostHog and removes them afterward.
Do not expose this key through a `VITE_` variable or a Worker runtime binding.
Local and CI builds without the key skip uploading source maps.
