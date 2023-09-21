# @fontsource-utils/cli

## 0.3.17

### Patch Changes

- [#838](https://github.com/fontsource/fontsource/pull/838) [`f09ea8eec4`](https://github.com/fontsource/fontsource/commit/f09ea8eec4459ff0e416ad9a1249b183443d75d3) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(cli): invalid urls generated for cdn and loosen types for CSS generators

## 0.3.16

### Patch Changes

- [#836](https://github.com/fontsource/fontsource/pull/836) [`398284bc90`](https://github.com/fontsource/fontsource/commit/398284bc90c51a27868b0f617136ff13f40f9182) Thanks [@ayuhito](https://github.com/ayuhito)! - refactor(cli): expose css generation for each package

## 0.3.15

### Patch Changes

- [`830b10c7ee`](https://github.com/fontsource/fontsource/commit/830b10c7ee0ff58e07e1f82fda3eaf086bb24a54) Thanks [@ayuhito](https://github.com/ayuhito)! - Fix variable font file paths in CSS.

## 0.3.14

### Patch Changes

- [#774](https://github.com/fontsource/fontsource/pull/774) [`699825b9dc`](https://github.com/fontsource/fontsource/commit/699825b9dca44f5781a6c2cd4a58e33759e19fb3) Thanks [@YusukeSano](https://github.com/YusukeSano)! - Remove square brackets from unicode subset of variable font.

## 0.3.13

### Patch Changes

- [#764](https://github.com/fontsource/fontsource/pull/764) [`b5df64999a`](https://github.com/fontsource/fontsource/commit/b5df64999a04dcb477b7771749436505a58820b7) Thanks [@ayuhito](https://github.com/ayuhito)! - Check for missing license in generateLicense function.

## 0.3.12

### Patch Changes

- [#762](https://github.com/fontsource/fontsource/pull/762) [`407982c7e4`](https://github.com/fontsource/fontsource/commit/407982c7e4f15dad8f3a88c2a7423e3c2969866e) Thanks [@ayuhito](https://github.com/ayuhito)! - Handle missing license metadata gracefully in CLI.

## 0.3.11

### Patch Changes

- [#756](https://github.com/fontsource/fontsource/pull/756) [`690d9f110a`](https://github.com/fontsource/fontsource/commit/690d9f110ad68681566314d9040b3ac17eeb99c9) Thanks [@ayuhito](https://github.com/ayuhito)! - Migrate code to new ESLint config and semantics.

- Updated dependencies [[`690d9f110a`](https://github.com/fontsource/fontsource/commit/690d9f110ad68681566314d9040b3ac17eeb99c9)]:
  - @fontsource-utils/generate@0.3.1

## 0.3.10

### Patch Changes

- [#751](https://github.com/fontsource/fontsource/pull/751) [`01a10a1b72`](https://github.com/fontsource/fontsource/commit/01a10a1b721f7b1f88b465afc04a4142c8cbf1de) Thanks [@ayuhito](https://github.com/ayuhito)! - Remove the display variables in [#640](https://github.com/fontsource/fontsource/pull/640) as browsers do not support CSS variables in `@font-face` blocks.

- [#754](https://github.com/fontsource/fontsource/pull/754) [`86f7436226`](https://github.com/fontsource/fontsource/commit/86f7436226a6e6daff4c831c2cbedeb60a2e982f) Thanks [@jwr1](https://github.com/jwr1)! - Deprecate $displayVar option from Sass Mixins

- Updated dependencies [[`01a10a1b72`](https://github.com/fontsource/fontsource/commit/01a10a1b721f7b1f88b465afc04a4142c8cbf1de)]:
  - @fontsource-utils/generate@0.3.0

## 0.3.9

### Patch Changes

- [#739](https://github.com/fontsource/fontsource/pull/739) [`7b70aa7812`](https://github.com/fontsource/fontsource/commit/7b70aa781228fb630dc1a0b59e0ba2ca124a944b) Thanks [@ayuhito](https://github.com/ayuhito)! - Undo custom package verifier changes from [#737](https://github.com/fontsource/fontsource/pull/737).

## 0.3.8

### Patch Changes

- [#733](https://github.com/fontsource/fontsource/pull/733) [`0f162c9e18`](https://github.com/fontsource/fontsource/commit/0f162c9e1893729352fb8467e2515e7bd65baa0e) Thanks [@Sh4rK](https://github.com/Sh4rK)! - Remove duplicated WOFF file downloads of different content for Google Font packages.

- [#731](https://github.com/fontsource/fontsource/pull/731) [`12a99e950c`](https://github.com/fontsource/fontsource/commit/12a99e950c5e6ee3c9d63c4b3358aaf373f62aa3) Thanks [@ayuhito](https://github.com/ayuhito)! - fix(cli): improve variable fonts readme

- [#737](https://github.com/fontsource/fontsource/pull/737) [`f1bf4e666d`](https://github.com/fontsource/fontsource/commit/f1bf4e666d7e3e59f1fcfbfd80cfdf54320d99b4) Thanks [@ayuhito](https://github.com/ayuhito)! - Add TTF/OTF support to the CLI under the `--ttf` flag. This does not update CSS files to include TTF variants, but instead can be used to populate the `font-files` repository making it an accessible source for developers.

## 0.3.7

### Patch Changes

- [#707](https://github.com/fontsource/fontsource/pull/707) [`e00f245b`](https://github.com/fontsource/fontsource/commit/e00f245b0d0a6c6a5e7b8b8e19bcb468ea5d3479) Thanks [@jwr12135](https://github.com/jwr12135)! - test(cli): add tests for sass mixins css output.

- [#703](https://github.com/fontsource/fontsource/pull/703) [`325ba223`](https://github.com/fontsource/fontsource/commit/325ba22389ef7710a355c5fc12864fcf27b0dc28) Thanks [@justalemming](https://github.com/justalemming)! - Add missing " to CSS example in `readme.ts`.

- [`169139c2`](https://github.com/fontsource/fontsource/commit/169139c21906f707c277f416f324e4695f62ad55) Thanks [@jwr12135](https://github.com/jwr12135)! - Fix incorrect sass mixin source path for non unicode fonts

## 0.3.6

### Patch Changes

- [#700](https://github.com/fontsource/fontsource/pull/700) [`b23bb3b5`](https://github.com/fontsource/fontsource/commit/b23bb3b5ec64fd7727a44777baaf262cf9d30589) Thanks [@ayuhito](https://github.com/ayuhito)! - When using the force flag, the stored publish hash was removed. This PR stores the hash even when force rebuilding.

## 0.3.5

### Patch Changes

- [#699](https://github.com/fontsource/fontsource/pull/699) [`dcd0323e`](https://github.com/fontsource/fontsource/commit/dcd0323e97eccdabe735f536f08e124bf4fc617e) Thanks [@ayuhito](https://github.com/ayuhito)! - Disable noto-serif-hk from generating APIv1 subset imports as the total package size exceeds NPM limitations.

- [#697](https://github.com/fontsource/fontsource/pull/697) [`91779cbe`](https://github.com/fontsource/fontsource/commit/91779cbea8d284d0cbef1934aecaee150308cc04) Thanks [@ayuhito](https://github.com/ayuhito)! - Fixes a bug where variable fonts with italic variants had overwritten the `index.css` file with italics as the default import.
