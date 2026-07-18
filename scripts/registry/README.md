# Registry scripts

These are maintainer tools for building Fontsource's text-only registry from
reviewed upstream Git commits. They are repository infrastructure, not public
Fontsource CLI commands.

Bun remains the repository package manager and command orchestrator. The
registry TypeScript itself runs directly on the Node version pinned in
`mise.toml`, which is also the runtime used for font inspection in CI.
The private workspace owns its complete command surface.

The basic flow is:

~~~text
google/fonts ──┐
               ├── generate.ts ── registry/index.json
nam-files ─────┘       │
                       ├── google.ts ── families, inspection, documents, axes
                       └── nam.ts ───── subset definitions
                                 │
schema.ts ── Zod contracts ──────┤
validator.ts ◀───────────────────┘
~~~

The generator reads local Git object repositories with complete history at
exact 40-character commits. Shallow repositories are rejected because they
cannot prove per-path source provenance. The one-time policy bootstrap needs
only the exact `font-files` tree. The scripts do not clone repositories, resolve
branches or tags, contact Google APIs, write font binaries, publish packages,
or update production services.

## Ownership boundaries

- `generate.ts` opens both pinned Git snapshots, runs each importer, writes the
  complete `registry/index.json` once, and validates the result.
- `google.ts` owns generated Google family metadata, source inspection,
  documents, licenses, and the compatibility axis registry.
- `nam.ts` owns normalized Unicode subset definitions.
- `git.ts` is the concrete read-only boundary for an exact Git tree. There is
  no provider interface or runtime configuration layer.
- `inspection.ts` maps Core's generic font inspection result into the registry
  schema without Google-specific assumptions.
- `policy.json` is Fontsource's reviewed publication decision. Recurring Google
  and NAM generation never modifies it.
- `bootstrap-policy.ts` is a one-time migration helper that seeds policy from
  the currently shipped package inventory. It is not part of recurring syncs.
- Core owns generic font inspection and processing. These scripts own
  provider-specific orchestration and normalization.
- The public CLI consumes API descriptors and verified artifacts to render
  packages; it does not ingest upstream repositories.

## Commands

Run commands from the repository root:

~~~sh
bun run --cwd scripts/registry generate -- <google-fonts-repo> <google-commit> <nam-files-repo> <nam-commit> <registry-dir>
bun run --cwd scripts/registry validate -- <registry-dir>
~~~

The generate command builds `@fontsource-utils/core` before running. It always
regenerates both importer outputs and validates the complete registry.

The one-time policy bootstrap requires a local checkout of the current
Fontsource package inventory:

~~~sh
bun run --cwd scripts/registry bootstrap-policy -- <font-files-repo> <commit> <registry-dir>
~~~

## Files

| File | Responsibility |
| --- | --- |
| `generate.ts` | Coordinate one complete generation and own the index |
| `git.ts` | Read one immutable local Git tree and its path history |
| `google.ts` | Parse and normalize the pinned `google/fonts` tree |
| `inspection.ts` | Normalize generic Core inspection into registry records |
| `nam.ts` | Normalize NAM repertoires and web-delivery slices |
| `proto/` | Define the reviewed Google and NAM ingestion contracts |
| `protobuf.ts` | Load those contracts and parse protobuf Text Format |
| `package.json` | Own the private workspace commands and dependencies |
| `schema.ts` | Define the canonical Zod registry schemas |
| `validator.ts` | Validate the complete registry and cross-file references |
| `bootstrap-policy.ts` | Seed explicit package policy once from shipped files |
| `shared.ts` | Small canonical JSON, filesystem, text, and hashing helpers |

Tests use small Git repositories and real font/NAM fixtures. They cover
deterministic regeneration, removed families, sparse variants, strict provider
fields, NAM ranges, and slicing order.

## Invariants

- Google and NAM inputs have complete history at exact immutable commits. The
  one-time policy bootstrap needs only an exact immutable tree.
- Generated JSON is canonical, deterministic, and schema-validated.
- Every current Google family is regenerated so generator changes cannot leave
  mixed-version records. Its origin is the exact latest commit that touched its
  family directory, independent of the previous registry output.
- Each subset definition records the exact latest commit that touched its NAM
  source path, independent of the previous registry output.
- Unknown provider fields fail ingestion so upstream schema changes are
  reviewed explicitly.
- Removed Google families remain recorded with `origin.available: false`.
- Package variants are explicit relations, never a weight/style cross-product.
- Registry contents are text only; source and generated font binaries belong
  outside `registry/`.
- A policy variant must resolve to exactly one inspected source.
- The same upstream commits plus the same reviewed policy and retained-family
  state produce byte-identical output from a clean or existing registry.

## Development checks

~~~sh
bun run --cwd scripts/registry typecheck
bun run --cwd scripts/registry test
bun run --cwd scripts/registry validate -- registry
bun run ci:format
~~~
