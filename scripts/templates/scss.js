const _ = require("lodash")

exports.scssMixins = _.template(
  `@mixin fontFace(
  $fontName: "<%= fontName %>",
  $fontId: "<%= fontId %>",
  $style: normal,
  $display: swap,
  $weight: 400,
  $fontDir: "~@fontsource/#{$fontId}/files",
  $unicodeMap: (<%= unicodeMap %>)
) {
  @each $subset, $unicodeRangeValues in $unicodeMap {
    @font-face {
      font-family: "#{$fontName}";
      font-style: $style;
      font-display: $display;
      font-weight: $weight;
      src: url("#{$fontDir}/#{$fontId}-#{$subset}-#{$weight}-#{$style}.woff2")
          format("woff2"),
        url("#{$fontDir}/#{$fontId}-all-#{$weight}-#{$style}.woff")
          format("woff");
      unicode-range: $unicodeRangeValues;
    }
  }
}

@mixin fontFaceCustom(
  $fontName: "<%= fontName %>",
  $fontId: "<%= fontId %>",
  $style: normal,
  $display: swap,
  $weight: 400,
  $woff2Path: "~@fontsource/#{$fontId}/files/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff2",
  $woffPath: "~@fontsource/#{$fontId}/files/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff",
  $unicodeRange: false,
  $unicodeRangeValues: (<%= defUnicode %>)
) {
  @font-face {
    font-family: "#{$fontName}";
    font-style: $style;
    font-display: $display;
    font-weight: $weight;
    src: url("#{$woff2Path}") format("woff2"), url("#{$woffPath}") format("woff");
    @if $unicodeRange {
      unicode-range: $unicodeRangeValues;
    }
  }
}
`
)

exports.scssGeneric = _.template(
  `@mixin fontFaceCustom(
  $fontName: "<%= fontName %>",
  $fontId: "<%= fontId %>",
  $style: normal,
  $display: swap,
  $weight: 400,
  $woff2Path: "~@fontsource/#{$fontId}/files/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff2",
  $woffPath: "~@fontsource/#{$fontId}/files/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff",
  $unicodeRange: false,
  $unicodeRangeValues: null
) {
  @font-face {
    font-family: "#{$fontName}";
    font-style: $style;
    font-display: $display;
    font-weight: $weight;
    src: url("#{$woff2Path}") format("woff2"), url("#{$woffPath}") format("woff");
    @if $unicodeRange {
      unicode-range: $unicodeRangeValues;
    }
  }
}
`
)
