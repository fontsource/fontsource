# Registry

This private workspace package maintains Fontsource's text-only font registry.
It is repository tooling, not a public package.

## Commands

Run from the repository root:

~~~sh
pnpm --filter '@fontsource-utils/registry' generate <google-repo> <google-commit> <nam-repo> <nam-commit>
pnpm --filter '@fontsource-utils/registry' validate
pnpm --filter '@fontsource-utils/registry' archive
~~~

Both source revisions must be exact 40-character commits. Generation also
requires complete Git history so per-path provenance is accurate; shallow
repositories are rejected.
Generation validates existing `policy.json` files but never creates or changes
package policy. Registry data is written to `data/` and refreshed weekly or on
demand by the [registry sync workflow](../.github/workflows/registry-sync.yml),
which validates changes before committing them to `main`.

The [registry archive workflow](../.github/workflows/registry-archive.yml)
runs after registry data changes. It copies the exact registry files and every
verified source font into the private `fontsource-registry` R2 bucket:

~~~text
registry/sha256/<sha256>
sources/sha256/<sha256>
snapshots/<fontsource-commit>/manifest.json
~~~

Each manifest maps registry paths and sources to their SHA-256 objects and is
written last. Google sources can be recovered from their pinned GitHub commit.
Registry-managed sources must already exist at their content-addressed R2 key.

Provision the bucket once:

~~~sh
wrangler r2 bucket create fontsource-registry
wrangler r2 bucket lock add fontsource-registry archive --retention-indefinite
~~~

The indefinite lock keeps published manifests and their content-addressed
objects from being overwritten or deleted.

The workflow needs `REGISTRY_R2_ENDPOINT` and bucket-scoped Object Read & Write
credentials in `REGISTRY_R2_ACCESS_KEY_ID` and
`REGISTRY_R2_SECRET_ACCESS_KEY`.

## Structure

- `scripts/generate.ts` coordinates one complete registry build and validation.
- `scripts/font-files.ts` implements opt-in Git-backed Fontsource ingestion. It
  is not part of scheduled generation yet.
- `scripts/google.ts` owns `data/families/google/` and writes family metadata,
  source inspection, documents, licenses, and normalized axis metadata.
- `scripts/nam.ts` writes Unicode subset and slicing definitions.
- `scripts/git.ts` reads immutable Git trees and path history.
- `scripts/inspection.ts` maps Core's provider-neutral font inspection into
  registry records.
- `scripts/schema.ts` defines the Zod contracts; `scripts/validator.ts` checks
  files and cross-file references.
- `data/families/<provider>/<id>/` contains family records. Family IDs are
  globally unique across providers.
- `data/subsets/` and `data/axes.json` contain shared Unicode and axis data.

## Invariants

- Inputs are local repositories pinned to exact commits.
- Output is canonical, deterministic, text-only, and schema-validated.
- Provenance comes from Git history, not prior generated metadata.
- Each provider owns its directory; Google generation never changes Fontsource
  records.
- Removed Google families remain buildable but are marked `deprecated`.
- `github` provenance can recover a missing source from an exact commit;
  `registry` provenance requires the source to be promoted to R2 first.
- Package policy is reviewed registry state, not derived from legacy catalogs.
- Package variants are explicit relations, not weight/style cross-products.
- Core owns generic font processing; these scripts own provider ingestion and
  NAM data.

## Font-files sources

The opt-in `fontsource/font-files` adapter accepts reviewed source families:

~~~text
sources/<id>/
  metadata.json
  license.txt
  files/*.ttf
  files/*.otf
  description.en-US.md
  article.en-US.md
~~~

The two Markdown files are optional. `metadata.json` contains the portable
family fields and declares every source file:

~~~json
{
	"id": "example",
	"family": "Example",
	"category": "sans-serif",
	"license": {
		"id": "OFL-1.1",
		"url": "https://openfontlicense.org/open-font-license-official-text/"
	},
	"declaredSubsets": ["latin"],
	"sourceFiles": [
		{
			"path": "files/Example-Regular.ttf",
			"variant": { "weight": 400, "style": "normal" }
		}
	]
}
~~~

The adapter derives hashes, sizes, inspection, modification dates, and Git
provenance. The source repository stores the raw binaries; this repository
commits only generated text records.

## Development

~~~sh
pnpm --filter '@fontsource-utils/registry' typecheck
pnpm --filter '@fontsource-utils/registry' test
pnpm check
~~~
