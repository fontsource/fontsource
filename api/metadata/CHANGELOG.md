# api

## 0.2.18

### Patch Changes

- [#1053](https://github.com/fontsource/fontsource/pull/1053) [`53d3103`](https://github.com/fontsource/fontsource/commit/53d31039607a8fb5c2a6478c74ae81cee23aa132) Thanks [@ayuhito](https://github.com/ayuhito)! - chore(biome): upgrade dependency and fix lints

## 0.2.17

### Patch Changes

- [#943](https://github.com/fontsource/fontsource/pull/943) [`ed72d85a61`](https://github.com/fontsource/fontsource/commit/ed72d85a61b9b90e270b6080cc5f21ec467fa1f1) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): introduce separate versions kv space

## 0.2.16

### Patch Changes

- [#941](https://github.com/fontsource/fontsource/pull/941) [`4e666ae7c0`](https://github.com/fontsource/fontsource/commit/4e666ae7c08e602ff3d29da1801d86b8888788c0) Thanks [@ayuhito](https://github.com/ayuhito)! - chore: add cron triggers to wrangler toml

- [#939](https://github.com/fontsource/fontsource/pull/939) [`0b94dd64f7`](https://github.com/fontsource/fontsource/commit/0b94dd64f70e360eee80c1c8c12b3ba6595f963b) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): return empty stats object if font exists but no stats

## 0.2.15

### Patch Changes

- [#935](https://github.com/fontsource/fontsource/pull/935) [`8ec7d3e3a2`](https://github.com/fontsource/fontsource/commit/8ec7d3e3a2af2906af1922500cce6a7d23a2d828) Thanks [@ayuhito](https://github.com/ayuhito)! - perf(api): use cron triggers to update kv metadata

## 0.2.14

### Patch Changes

- Updated dependencies [[`c9796f8e94`](https://github.com/fontsource/fontsource/commit/c9796f8e945a20ee0418174104b7b25533d836a9)]:
  - common-api@0.1.8

## 0.2.13

### Patch Changes

- [#906](https://github.com/fontsource/fontsource/pull/906) [`35d51de765`](https://github.com/fontsource/fontsource/commit/35d51de76586110383a8e1ff9c414204b62e367c) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): include variable icons metadata to variable api

- Updated dependencies [[`35d51de765`](https://github.com/fontsource/fontsource/commit/35d51de76586110383a8e1ff9c414204b62e367c)]:
  - common-api@0.1.7

## 0.2.12

### Patch Changes

- [#902](https://github.com/fontsource/fontsource/pull/902) [`4ee5a5493c`](https://github.com/fontsource/fontsource/commit/4ee5a5493c5b32852c19a6296db19075cc746481) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): invalid version sorting

## 0.2.11

### Patch Changes

- [#886](https://github.com/fontsource/fontsource/pull/886) [`4883910a53`](https://github.com/fontsource/fontsource/commit/4883910a532c104b04d8e595a4679704c5571ea2) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): store version stats in correct kv cache

## 0.2.10

### Patch Changes

- [#881](https://github.com/fontsource/fontsource/pull/881) [`cd2f04c871`](https://github.com/fontsource/fontsource/commit/cd2f04c871e1d7245e5453aa139db9efbfa2989d) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): remove variable variants

- Updated dependencies [[`cd2f04c871`](https://github.com/fontsource/fontsource/commit/cd2f04c871e1d7245e5453aa139db9efbfa2989d)]:
  - common-api@0.1.6

## 0.2.9

### Patch Changes

- [#879](https://github.com/fontsource/fontsource/pull/879) [`3e923f117d`](https://github.com/fontsource/fontsource/commit/3e923f117d29853a05af0aa38b7f64f9f431c25b) Thanks [@ayuhito](https://github.com/ayuhito)! - feat(api): add variable data to stats api

## 0.2.8

### Patch Changes

- [#874](https://github.com/fontsource/fontsource/pull/874) [`fb1e1fde07`](https://github.com/fontsource/fontsource/commit/fb1e1fde070331e1652bce1873c866313d82fc2b) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): should 404 unknown id for stats

## 0.2.7

### Patch Changes

- [#871](https://github.com/fontsource/fontsource/pull/871) [`752ee7fc6d`](https://github.com/fontsource/fontsource/commit/752ee7fc6deb8332546b20bb99ef7d7c890d6761) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): correct ttls to use seconds everywhere

## 0.2.6

### Patch Changes

- [#869](https://github.com/fontsource/fontsource/pull/869) [`d5bfe10160`](https://github.com/fontsource/fontsource/commit/d5bfe10160ca61f623d3956496cbf394e278952c) Thanks [@ayuhito](https://github.com/ayuhito)! - perf(api): use jsdelivr cache for redirects and metadata variants

## 0.2.5

### Patch Changes

- [#867](https://github.com/fontsource/fontsource/pull/867) [`0591a748f1`](https://github.com/fontsource/fontsource/commit/0591a748f134470b3b49abc435df115fad4ba9dd) Thanks [@ayuhito](https://github.com/ayuhito)! - perf(api): use jsdelivr cdn for font files in css

## 0.2.4

### Patch Changes

- [#840](https://github.com/fontsource/fontsource/pull/840) [`bbed1e08f5`](https://github.com/fontsource/fontsource/commit/bbed1e08f5db793bd73a00ec83e47a6d926da275) Thanks [@ayuhito](https://github.com/ayuhito)! - Add variable fonts and CSS support to the CDN Worker.
  Also added variable data to the Version API.
- Updated dependencies [[`bbed1e08f5`](https://github.com/fontsource/fontsource/commit/bbed1e08f5db793bd73a00ec83e47a6d926da275)]:
  - common-api@0.1.5

## 0.2.3

### Patch Changes

- [#833](https://github.com/fontsource/fontsource/pull/833) [`124c493560`](https://github.com/fontsource/fontsource/commit/124c493560b5695a31b0143f09719711fb096809) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(api): redirect deprecated api url to origin workers

## 0.2.2

### Patch Changes

- [#830](https://github.com/fontsource/fontsource/pull/830) [`f995b21170`](https://github.com/fontsource/fontsource/commit/f995b211702a62e0b93f82cca0cc194778272ad6) Thanks [@ayuhito](https://github.com/ayuhito)! - feat(api): add stats and version endpoints

- Updated dependencies [[`f995b21170`](https://github.com/fontsource/fontsource/commit/f995b211702a62e0b93f82cca0cc194778272ad6)]:
  - common-api@0.1.4

## 0.2.1

### Patch Changes

- [#829](https://github.com/fontsource/fontsource/pull/829) [`d93e483504`](https://github.com/fontsource/fontsource/commit/d93e48350457b31a74d8a191742a9740deb7278a) Thanks [@ayuhito](https://github.com/ayuhito)! - Use the Cache API for API and CDN workers.

- [#827](https://github.com/fontsource/fontsource/pull/827) [`a5578da582`](https://github.com/fontsource/fontsource/commit/a5578da58241ca1ad03c714b9541e904126dada6) Thanks [@ayuhito](https://github.com/ayuhito)! - Return an object instead of an array for the axis registry endpoint.

## 0.2.0

### Minor Changes

- [#826](https://github.com/fontsource/fontsource/pull/826) [`880624c251`](https://github.com/fontsource/fontsource/commit/880624c251c71e6e3e2155202a1a5ae821155970) Thanks [@ayuhito](https://github.com/ayuhito)! - feat(api): add axis registry queries

### Patch Changes

- [#824](https://github.com/fontsource/fontsource/pull/824) [`c9a873d82b`](https://github.com/fontsource/fontsource/commit/c9a873d82b2b0ddca1a2d2b1dc1f3ff17e99682e) Thanks [@ayuhito](https://github.com/ayuhito)! - feat(api): add variable metadata endpoints

## 0.1.12

### Patch Changes

- [#820](https://github.com/fontsource/fontsource/pull/820) [`ecbdc954b9`](https://github.com/fontsource/fontsource/commit/ecbdc954b9a9584b7d4035da9293a5d5d22a5fac) Thanks [@ayuhito](https://github.com/ayuhito)! - feat(api): add cors headers to cdn api

- Updated dependencies [[`9e4c4e9cd6`](https://github.com/fontsource/fontsource/commit/9e4c4e9cd66428fd12cf6963862502c1239ea146)]:
  - common-api@0.1.3

## 0.1.11

### Patch Changes

- Updated dependencies [[`827a5b4017`](https://github.com/fontsource/fontsource/commit/827a5b4017d81bf1f64f71e181e134151d546f7b), [`5cbc917f79`](https://github.com/fontsource/fontsource/commit/5cbc917f791f3d18aa95b05802285808d4a78cf1)]:
  - common-api@0.1.2

## 0.1.10

### Patch Changes

- [#812](https://github.com/fontsource/fontsource/pull/812) [`832a38f961`](https://github.com/fontsource/fontsource/commit/832a38f9617fda2c845b6b0daf3c6a68e69858fc) Thanks [@ayuhito](https://github.com/ayuhito)! - perf(api): cache metadata on edge

## 0.1.9

### Patch Changes

- [#810](https://github.com/fontsource/fontsource/pull/810) [`08cc41ccbb`](https://github.com/fontsource/fontsource/commit/08cc41ccbbb61519c4a5421dfa0376961c17530c) Thanks [@ayuhito](https://github.com/ayuhito)! - perf(website): increase concurrency for download worker

## 0.1.8

### Patch Changes

- [#808](https://github.com/fontsource/fontsource/pull/808) [`917bedd06b`](https://github.com/fontsource/fontsource/commit/917bedd06bd806d50240c9f87e0dd91b44be9077) Thanks [@ayuhito](https://github.com/ayuhito)! - Migrate away from the download worker and use the website VM to populate the R2 buckets.

- Updated dependencies [[`917bedd06b`](https://github.com/fontsource/fontsource/commit/917bedd06bd806d50240c9f87e0dd91b44be9077)]:
  - common-api@0.1.1

## 0.1.7

### Patch Changes

- [#806](https://github.com/fontsource/fontsource/pull/806) [`850ce4f2f2`](https://github.com/fontsource/fontsource/commit/850ce4f2f2f285795ca025dc8f375813cb8e119e) Thanks [@ayuhito](https://github.com/ayuhito)! - Add versioned buckets support to download worker.

- Updated dependencies [[`850ce4f2f2`](https://github.com/fontsource/fontsource/commit/850ce4f2f2f285795ca025dc8f375813cb8e119e)]:
  - common-api@null

## 0.1.6

### Patch Changes

- [#803](https://github.com/fontsource/fontsource/pull/803) [`b3917db10b`](https://github.com/fontsource/fontsource/commit/b3917db10b338c267a2c89094bb0427aa7660e6d) Thanks [@ayuhito](https://github.com/ayuhito)! - Update cache expiry rules for metadata worker to 6 hours and remove unnecessary CF Cache API references.

## 0.1.5

### Patch Changes

- [#801](https://github.com/fontsource/fontsource/pull/801) [`7fb5ee6e01`](https://github.com/fontsource/fontsource/commit/7fb5ee6e019ff3d28e11eea61dffbdf97c77a33d) Thanks [@ayuhito](https://github.com/ayuhito)! - This adds SWR caching to the metadata API with 1-hour TTLs to the original source for faster performance and more up-to-date metadata.

## 0.1.4

### Patch Changes

- [#791](https://github.com/fontsource/fontsource/pull/791) [`c8eaf1f911`](https://github.com/fontsource/fontsource/commit/c8eaf1f91136fc837295ead9672458f0d1707866) Thanks [@jwr1](https://github.com/jwr1)! - Fix id query not allowed in API fonts route

## 0.1.3

### Patch Changes

- [#759](https://github.com/fontsource/fontsource/pull/759) [`aeeb293236`](https://github.com/fontsource/fontsource/commit/aeeb29323657d76313a743d951c90905999407e9) Thanks [@ayuhito](https://github.com/ayuhito)! - Add CORS headers to API responses.

## 0.1.2

### Patch Changes

- [#756](https://github.com/fontsource/fontsource/pull/756) [`690d9f110a`](https://github.com/fontsource/fontsource/commit/690d9f110ad68681566314d9040b3ac17eeb99c9) Thanks [@ayuhito](https://github.com/ayuhito)! - Migrate code to new ESLint config and semantics.

## 0.1.1

### Patch Changes

- [#742](https://github.com/fontsource/fontsource/pull/742) [`82444a498f`](https://github.com/fontsource/fontsource/commit/82444a498fa45b0f883f0aa1e96ce521af812206) Thanks [@ayuhito](https://github.com/ayuhito)! - Disable worker dev URLs in wrangler.toml.
