# AGENTS.md

## Project Overview

Fontsource is a Bun/TypeScript monorepo for self-hostable font packages, shared font tooling, Cloudflare API workers, and the Fontsource website/docs.

- `packages/*` contains shared libraries and CLI/publishing tooling.
- `api/*` contains Cloudflare Workers, shared API utilities, and the newer combined worker API.
- `website` contains the React Router/Vite web app and MDX documentation.
- Preserve self-hosted font package behavior, metadata semantics, generated CSS/assets, package exports, and publishing behavior unless the task explicitly changes them.

## Working Principles

- Make the smallest task-scoped change that solves the problem.
- Follow nearby package, worker, component, and test style before introducing a new pattern.
- Avoid drive-by refactors, broad formatting churn, file moves, renames, and dependency churn.
- Preserve public package APIs, API response shapes, cache headers, worker bindings, website routes, and generated package output unless the task requires changing them.
- Prefer existing workspace utilities and scripts over new tooling.
- Treat `package.json`, `bun.lock`, `mise.toml`, `biome.json`, `tsconfig.json`, `vitest.workspace.ts`, and `.github/workflows/*` as sources of truth.

## Tooling and Commands

Use Bun as the package manager/runtime. `mise.toml` is the local tool source of truth and currently selects Bun.

- Install dependencies: `bun install`.
- Root build for package workspaces: `bun run build`.
- Root tests: `bun run test`.
- Root coverage: `bun run coverage`.
- Root lint across workspaces: `bun run lint`.
- Root CI lint: `bun run ci:lint`.
- Root format write: `bun run format`.
- Root format check: `bun run ci:format`.
- Root CI package test flow: `bun run ci:test`.

Useful focused commands:

- Core package: `cd packages/core && bun run typecheck`, `bun run test:unit`, or `bun run test:integration`.
- Website: `cd website && bun run dev`, `bun run build`, or `bun run typecheck`.
- Existing API workers: `cd api/<worker> && bun run dev`, `bun run test`, or `bun run coverage` when the package defines them.
- Combined worker API: `cd api/worker && bun run dev`, `bun run test`, `bun run typecheck`, or `bun run cf-typegen`.

Publish, deploy, release, upload, and version scripts exist for CI and maintainers. Do not run `ci:publish`, `ci:publish-api`, `ci:version`, `deploy`, `deploy:staging`, `release`, `bun publish`, `wrangler deploy`, `flyctl deploy`, or upload commands unless explicitly requested.

## TypeScript and Monorepo Style

- Use modern TypeScript consistent with local `tsconfig.json` and surrounding code.
- Preserve ESM/module conventions in nearby files.
- Keep exported/public types readable; avoid `any` and broad assertions unless the boundary or nearby code already requires them.
- Prefer package-local helpers before adding cross-package abstractions.
- Do not make workspace-wide changes for a local task.
- Add dependencies only when clearly required and approved by the task.
- Workspace package exports, `bin` entries, and `files` lists define public package boundaries; change them deliberately.

## Testing

- Use Vitest patterns already present in the target package or worker.
- Add or update tests for changed behavior, close to the changed package/worker/component.
- Start with targeted tests; use broader root checks for cross-workspace changes.
- API worker tests may use Miniflare or `@cloudflare/vitest-pool-workers`; follow the package's `vitest.config.ts`.
- Snapshot tests are common for CSS, generated metadata, API responses, and fixtures. Do not update snapshots blindly; inspect whether the output change is intended.
- If local validation cannot run, explain why and give the next-best command.

## Website

- Follow the existing React Router, Vite, MDX, Mantine, CSS module, and Cloudflare Worker conventions in `website`.
- Keep routes, docs layout, `website/docs/sidebar.json`, metadata, cache headers, and loader behavior stable unless the task changes them.
- For docs-only changes under `website/docs`, avoid duplicating setup text that already lives in README files.
- For UI changes, inspect rendered behavior or at least run `cd website && bun run build` or `bun run typecheck` when practical.
- Keep accessibility, responsive states, loading states, empty/error states, and existing design language in mind.

## API Workers

- Existing workers under `api/cdn`, `api/metadata`, and `api/upload` use Cloudflare Workers, Wrangler, KV/R2 bindings, and itty-router patterns.
- `api/worker` uses Hono/Chanfana with Cloudflare Vite/Vitest tooling and a container-backed artifact builder; follow its local route/schema/test patterns.
- Do not deploy, upload, mutate R2/KV, or call production-like external services unless explicitly requested.
- Preserve response bodies, status codes, cache headers, redirects, ETags, CORS behavior, scheduled refresh behavior, and compatibility endpoints unless the task explicitly changes them.
- Treat secrets, `.dev.vars`, auth tokens, and worker bindings as sensitive. Do not print, commit, or hard-code them.
- Regenerate worker binding types only through verified scripts such as `wrangler types`, `bun run typegen`, or `bun run cf-typegen`.

## Font Packages and Generation

- Be careful with font metadata, package manifests, CSS generation, SCSS mixins, generated assets, and package README semantics.
- Before changing generation logic, inspect representative generated output and the relevant tests/snapshots.
- Regenerate artifacts only through verified repo scripts; do not hand-edit generated package output when a generator owns it.
- Preserve package naming, export paths, CSS URL behavior, `@font-face` output, variable axis behavior, license metadata, and publishing semantics unless the task explicitly changes them.
- The publishing utility uses package hashes and registry checks; treat it as release infrastructure, not general-purpose app code.

## Formatting, Linting, and Generated Files

- `biome.json` is the formatting/linting source of truth; use repo scripts instead of manually enforcing style.
- Biome intentionally excludes `coverage`, `__snapshots__`, `dist`, `build`, `worker-configuration.d.ts`, and `.react-router`.
- Ignored/local outputs include `.wrangler`, `.dev.vars`, `dist`, `api/dist`, `api/worker/bin`, `*.tsbuildinfo`, `mise.local.toml`, root `AGENT.md`, and generated XML files.
- Do not weaken lint/format config unless explicitly requested.
- If generated files changed, explain which source command or source change caused them.

## Definition of Done

- The diff is minimal and scoped to the task.
- Relevant targeted tests/builds/lints were run for the changed area.
- Broader root checks were run for cross-workspace changes.
- Formatting/linting was run when source files changed.
- Generated output was regenerated only when required and through verified scripts.
- No unrelated dependencies, lockfile changes, generated files, publish/deploy changes, or environment changes were introduced.
- If validation was skipped, the final response explains why and names the next-best command.

## What To Avoid

- Do not run publish, deploy, version, upload, or release commands unless explicitly asked.
- Do not edit generated font/package output or generated worker types by hand.
- Do not make broad monorepo refactors for a narrow issue.
- Do not add dependencies to solve small local problems.
- Do not guess worker bindings, API behavior, package exports, or generated output semantics.
- Do not duplicate long README/setup instructions here; reference the source file instead.
