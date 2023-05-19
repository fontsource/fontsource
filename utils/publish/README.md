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

1. Use folder hashes (recursive filehashes) to determine if a package has changed.
2. Bump packages and validate they are publishable by comparing versions on the NPM registry.
3. Use pacote and libnpmpublish to pack and publish the packages.
