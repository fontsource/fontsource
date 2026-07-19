# Registry

This private workspace package builds Fontsource's text-only registry from
pinned Google Fonts and NAM repository snapshots. It is repository tooling,
not a public package.

## Commands

Run from the repository root:

~~~sh
pnpm --filter '@fontsource-utils/registry' generate <google-repo> <google-commit> <nam-repo> <nam-commit>
pnpm --filter '@fontsource-utils/registry' validate
~~~

Both source revisions must be exact 40-character commits. Generation also
requires complete Git history so per-path provenance is accurate; shallow
repositories are rejected.
Generation validates existing `policy.json` files but never creates or changes
package policy. Registry data is written to `data/` and refreshed weekly or on
demand by the [registry sync workflow](../.github/workflows/registry-sync.yml),
which validates changes before committing them to `main`.

## Structure

- `scripts/generate.ts` coordinates one complete registry build and validation.
- `scripts/google.ts` writes family metadata, source inspection, documents,
  licenses, and normalized axis metadata.
- `scripts/nam.ts` writes Unicode subset and slicing definitions.
- `scripts/git.ts` reads immutable Git trees and path history.
- `scripts/inspection.ts` maps Core's provider-neutral font inspection into
  registry records.
- `scripts/schema.ts` defines the Zod contracts; `scripts/validator.ts` checks
  files and cross-file references.
- `data/` contains the generated registry and is added separately from the
  tooling.

## Invariants

- Inputs are local repositories pinned to exact commits.
- Output is canonical, deterministic, text-only, and schema-validated.
- Provenance comes from Git history, not prior generated metadata.
- Removed Google families remain recorded as unavailable.
- Package policy is reviewed registry state, not derived from legacy catalogs.
- Package variants are explicit relations, not weight/style cross-products.
- Core owns generic font processing; these scripts own Google and NAM ingestion.

## Development

~~~sh
pnpm --filter '@fontsource-utils/registry' typecheck
pnpm --filter '@fontsource-utils/registry' test
pnpm check
~~~
