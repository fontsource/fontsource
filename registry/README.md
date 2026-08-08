# Registry

This private workspace package maintains Fontsource's font registry as
text-only metadata. It is repository tooling, not a public package.

## Commands

Run from the repository root:

~~~sh
pnpm --filter '@fontsource-utils/registry' generate <google-repo> <google-commit> <google-icons-repo> <google-icons-commit> <nam-repo> <nam-commit> <font-files-repo> <font-files-commit>
pnpm --filter '@fontsource-utils/registry' validate
pnpm --filter '@fontsource-utils/registry' check:font-files <font-files-repo>
pnpm --filter '@fontsource-utils/registry' archive
~~~

All source revisions must be exact 40-character commits. Generation also
requires complete Git history so per-path provenance is accurate; shallow
repositories are rejected.
Generation requires existing `distribution.json` files but never creates or
changes distribution intent. Registry data is written to `data/` and refreshed
weekly or on demand by the
[registry sync workflow](../.github/workflows/registry-sync.yml), which
validates changes before committing them to `main`.
Families present in the previous registry but absent from their provider are
retained with their original sources and marked `deprecated`. A reappearing
family is generated as active again unless it has a reviewed replacement.
Successors are never guessed: `data/replacements.json` contains only reviewed
mappings.
Google’s explicit language lists override cmap detection. References without a
language record are logged and omitted; other families are matched against the
registry language requirements using the cmap shared by every source face.
Reviewed corrections in `data/family-overrides.json` are applied after provider
generation when character coverage alone would produce misleading language
claims or a specialist font has no useful specimen text.

The [registry archive workflow](../.github/workflows/registry-archive.yml)
runs after registry data changes. It copies the exact registry files and every
verified source font into the private `fontsource-registry` R2 bucket:

~~~text
registry/sha256/<sha256>
sources/sha256/<sha256>
snapshots/<fontsource-commit>/api/...
snapshots/<fontsource-commit>/manifest.json
current.json
~~~

Each snapshot includes family, language, subset, axis, symbol, and source
capability views projected into the public API contract in
[`api/shared/registry.ts`](../api/shared/registry.ts).
Family detail views always include the complete license and reviewed
distribution with an explicit `all` or `subsets` character mode. Icon families
also declare their supported input modes and link to the lazy symbol catalog;
every source links to its capability view.
Each family detail also identifies the representative source used for capability
inspection. Families whose best preview subset differs from their package
default expose that reviewed subset explicitly.
The committed registry format remains private and can change without changing
those responses. The manifest maps every registry file, API view, and source to
a SHA-256 object and is written before `current.json` selects the complete
snapshot.

Google font and icon sources can be recovered from their pinned GitHub commit.
Registry-managed sources must already exist at their content-addressed R2 key.

The workflow needs `REGISTRY_R2_ENDPOINT` and bucket-scoped Object Read & Write
credentials in `REGISTRY_R2_ACCESS_KEY_ID` and
`REGISTRY_R2_SECRET_ACCESS_KEY`.

## Structure

- `scripts/generate.ts` coordinates one complete registry build and validation.
- `scripts/font-files.ts` implements Git-backed Fontsource ingestion.
- `scripts/google-icons.ts` ingests Material Icons, Material Symbols, and their
  public name-to-codepoint mappings.
- `scripts/google.ts` owns `data/families/google/` and writes family metadata,
  discovery metadata, source inspection, documents, licenses, languages, and
  normalized axis metadata.
- `scripts/nam.ts` writes Unicode subset and slicing definitions.
- `scripts/git.ts` reads immutable Git trees and path history.
- `scripts/inspection.ts` maps Core's provider-neutral font inspection into
  registry records.
- `scripts/schema.ts` defines the Zod contracts; `scripts/validator.ts` checks
  files and cross-file references.
- `data/upstreams.json` records the exact source repository revisions.
- `data/families/<provider>/<id>/family.json` combines family metadata, source
  declarations, and inspected source properties, including glyph coverage,
  layout features, outlines, and color tables. IDs are globally unique across
  providers and are derived from directory names.
- Every family includes `license.txt` and `distribution.json`. Distribution
  records the exact static variants, variable axis bundles, and character
  distribution Fontsource publishes. Character distribution is either the
  full repertoire or named subset mappings with an optional family-wide
  slicing strategy.
- Icon families also include `icons.json` with public names, Unicode
  codepoints, and supported input modes.
- `data/languages.json` defines semantic languages, public names, and the
  private codepoint requirements used for automatic matching.
- `data/replacements.json` records reviewed successor relationships between
  globally unique family IDs.
- `data/family-tags.json` assigns reviewed cross-provider discovery tags.
- `data/family-overrides.json` contains reviewed language, specimen, and preview
  subset corrections that provider syncs must preserve.
- `data/taxonomy.json` defines the reviewed classification and tag labels.
- `data/subsets/` and `data/axes.json` contain shared Unicode and axis data.

## Invariants

- Inputs are local repositories pinned to exact commits.
- Output is canonical, deterministic, text-only, and schema-validated.
- Public API views explicitly map registry records rather than exposing them.
- Provenance comes from Git history, not prior generated metadata.
- Each provider owns its directory; one adapter never changes another
  provider's records.
- Removed provider families remain buildable but are marked `deprecated`.
- Replaced families retain their own sources; `replacedBy` recommends an active
  successor and never aliases its binaries.
- `github` provenance can recover a missing source from an exact commit;
  `registry` provenance requires the source to be promoted to R2 first.
- Distribution is reviewed registry state, not derived from legacy catalogs.
- Taxonomy describes discovery and context. It does not select input behavior;
  symbol interaction comes only from a catalog's explicit input modes.
- If a Google Fonts family omits its license file, sync preserves the reviewed
  license text already committed for that family and fails when none exists.
- Published variants are explicit relations, not weight/style cross-products.
- Named subset definitions and a slicing strategy are separate outputs. A
  family-wide slicing strategy replaces named subsets in aggregate CSS.
- Build format, package version, storage paths, and artifact hashes are global
  release concerns and do not belong in family distribution records.
- Core owns generic font processing; these scripts own provider ingestion and
  NAM data.

## Font-files sources

The `fontsource/font-files` adapter accepts reviewed source families:

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
	"classifications": ["display", "sans-serif"],
	"license": {
		"id": "OFL-1.1",
		"url": "https://openfontlicense.org/open-font-license-official-text/"
	},
	"sourceFiles": [
		{
			"path": "files/Example-Regular.ttf",
			"variant": { "weight": 400, "style": "normal" }
		}
	]
}
~~~

The adapter derives hashes, sizes, inspection, modification dates, Git
provenance, and languages supported by every source face. Optional `tags` are
reviewed discovery metadata. An optional `languages` list overrides automatic
matching, including an empty list for fonts with no semantic language support.
The source repository stores the raw binaries; this repository commits only
generated text records.

## Development

~~~sh
pnpm --filter '@fontsource-utils/registry' typecheck
pnpm --filter '@fontsource-utils/registry' test
pnpm check
~~~
