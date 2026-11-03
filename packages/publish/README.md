# Fontsource Utils Publish

This CLI is used to publish the Fontsource packages to NPM. It is not intended for use by end users.

Commonly used publishers cannot publish the sheer quantity of packages that Fontsource has, thus a custom solution is required. This package does not take feature requests unless it directly relates to Fontsource.

## Getting Started

```bash
# Install dependencies
npm install @fontsource-utils/publish

# Run the CLI and generate initial config
npx @fontsource-utils/publish init
```

# How It Works

1. Hash npm's publishable file list, including font binaries, paths, and package metadata. Only `version` and `publishHash` are excluded from change detection.
2. Set the selected version and hash, then pack once without lifecycle scripts. These are already-generated font packages.
3. Publish that tarball and verify its integrity against the exact npm version. An existing version is accepted only when its bytes match.
4. Commit verified package directories. Failed packages retain their previous version and hash, and the command exits unsuccessfully.

For main-repository release orchestration, use `publish <version> --yes --no-git --report <path>`. The JSON report contains `published` package records and `failed` records, including partial failures. Keep it outside package directories. The workflow owns committing the verified directories; no GitHub token is required with `--no-git`.

This changes the hash algorithm, so packages carrying the previous hashes will be considered changed once. Preserve the `font-files` baseline between runs. `from-package` retries an explicitly selected version; it never overwrites a different npm payload.
