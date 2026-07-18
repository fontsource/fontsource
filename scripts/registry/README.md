# Registry scripts

These maintainer scripts build Fontsource's text-only registry from pinned
Google Fonts and NAM repository snapshots. They are repository tooling, not
public CLI commands.

## Commands

Run from the repository root:

~~~sh
pnpm --filter fontsource-registry-tools generate <google-repo> <google-commit> <nam-repo> <nam-commit> <registry-dir>
pnpm --filter fontsource-registry-tools validate <registry-dir>
~~~

Both source revisions must be exact 40-character commits. Generation also
requires complete Git history so per-path provenance is accurate; shallow
repositories are rejected.
Generation validates existing `policy.json` files but never creates or changes
package policy.

## Structure

- `generate.ts` coordinates one complete registry build and validation.
- `google.ts` writes family metadata, source inspection, documents, licenses,
  and normalized axis metadata.
- `nam.ts` writes Unicode subset and slicing definitions.
- `git.ts` reads immutable Git trees and path history.
- `inspection.ts` maps Core's provider-neutral font inspection into registry
  records.
- `schema.ts` defines the Zod contracts; `validator.ts` checks files and
  cross-file references.

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
pnpm --filter fontsource-registry-tools typecheck
pnpm --filter fontsource-registry-tools test
pnpm check
~~~
