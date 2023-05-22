# @fontsource-utils/cli

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
