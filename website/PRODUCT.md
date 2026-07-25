# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fontsource primarily serves web developers and designers who are choosing, evaluating, and integrating fonts into websites and applications. Maintainers and contributors are a secondary audience.

Over time, the website should become easier for people without specialist web-font knowledge to use while continuing to support developer workflows.

## Product Purpose

Fontsource helps people discover, preview, and use open-source fonts. It packages font families into individual, versioned dependencies so they can be self-hosted like other project assets.

Success means users can find an appropriate font, understand how it behaves, and move from evaluation to a reliable integration path without unnecessary friction.

## Positioning

Fontsource combines an open-source font directory and interactive previews with package-first, versioned self-hosting. It gives developers control over font versions, delivery, privacy, and offline availability while also offering exact-version CDN access when direct self-hosting is not practical.

## Operating Context

Users browse and filter font families by properties such as language, category, and variable-font support. They preview and configure individual families, save browser-local collections, and then install packages, copy generated CSS or CDN snippets, or download font assets.

The website also provides documentation, API reference material, and browser-based font tools. The font converter processes TTF, OTF, WOFF, and WOFF2 files locally without uploading them to a server.

## Capabilities and Constraints

- Font families are open source and distributed as individual npm packages.
- Static and variable fonts have distinct package and asset conventions.
- Package versions and exact-version CDN URLs are part of reliable production use.
- Self-hosting is the recommended path; CDN delivery is a supported alternative.
- Font metadata, subsets, weights, styles, variable axes, licenses, generated CSS, and package naming are product-critical data.
- Users can search, filter, preview, configure, install, download, and organize fonts into browser-local collections.
- The site supports light and dark color schemes and responsive layouts.
- Font licenses vary by family. The product must not imply that every font uses the same license.
- The website is a React Router application deployed to Cloudflare Workers and depends on Fontsource APIs and Algolia search.

## Brand Commitments

Preserve the Fontsource name, existing logo, and open-source identity. Product language should be direct, practical, and technically accurate while becoming more approachable to non-specialists.

The documented rationale for Fontsource includes performance, version locking, privacy, offline availability, and support for fonts beyond the Google Fonts ecosystem. Future work must present these as qualified, supportable benefits rather than inventing absolute guarantees.

## Evidence on Hand

- The Fontsource name and logo are implemented in `app/components/logo/LogoText.tsx` and `public/logo.svg`.
- Product purpose and self-hosting rationale are documented in the repository `README.md` and `docs/getting-started/introduction.mdx`.
- Installation, CDN, API, migration, and troubleshooting guidance exists under `docs/`.
- Real font metadata, previews, download statistics, package versions, and generated integration snippets are available through the website and Fontsource APIs.
- The repository contains sponsor assets, but there are no confirmed customer testimonials or case studies that future work should fabricate.

## Product Principles

1. Make open-source fonts straightforward to discover, evaluate, and use.
2. Preserve developer control through versioned, self-hostable packages and explicit delivery choices.
3. Reduce specialist knowledge requirements without weakening advanced developer workflows.
4. Treat font metadata, licensing, generated output, and public integration contracts as product truth.
5. Prefer accurate, inspectable guidance over broad marketing claims.

## Accessibility & Inclusion

There is no currently mandated accessibility standard. Improving accessibility is an ongoing product goal and a meaningful bonus for current work.

Future improvements should make font discovery and integration understandable to people without web-development expertise while preserving keyboard access, semantic structure, responsive behavior, readable content, and support for established developer workflows.
