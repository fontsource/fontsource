# Fontsource Website

The website is a React Router and Vite application deployed to Cloudflare Workers.

## Setup

Install the monorepo from its root with `pnpm install`, then run:

```sh
cd website
cp .dev.vars.example .dev.vars
pnpm db:migrate
pnpm dev
```

Use `pnpm typecheck`, `pnpm test`, and `pnpm build` for local validation.

The local auth callback URLs are:

- `http://localhost:5173/api/auth/callback/google`
- `http://localhost:5173/api/auth/callback/github`

GitHub OAuth apps support one callback URL, so local development needs separate
credentials from production.

## Account Deployment

Before the first deployment with account support:

1. Create the production database with
   `pnpm exec wrangler d1 create fontsource-app`.
2. Add the returned `database_id` to the `APP_DB` binding in `wrangler.toml`.
3. Configure every secret listed in `wrangler.toml` with
   `pnpm exec wrangler secret put <NAME>`.
4. Configure the provider callback URLs:
   - `https://fontsource.org/api/auth/callback/google`
   - `https://fontsource.org/api/auth/callback/github`
5. Run `pnpm db:migrate:remote` before `pnpm deploy`.

Apply new D1 migrations before deploying code that depends on them.
