const _ = require("lodash")

exports.scssMixins = _.template(
  `$fontName: "<%= fontName %>" !default;
$fontId: "<%= fontId %>" !default;
$style: normal !default;
$display: swap !default;
$weight: 400 !default;
$fontDir: "~@fontsource/#{$fontId}/files" !default;
$unicodeMap: (<%= unicodeMap %>) !default;

@mixin fontFace(
  $fontName: $fontName,
  $fontId: $fontId,
  $style: $style,
  $display: $display,
  $weight: $weight,
  $fontDir: $fontDir,
  $unicodeMap: $unicodeMap
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

$fontDir: "~@fontsource/#{$fontId}/files" !default;
$woff2Path: "#{$fontDir}/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff2" !default;
$woffPath: "#{$fontDir}/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff" !default;
$unicodeRange: false !default;
$unicodeRangeValues: (<%= defUnicode %>) !default;

@mixin fontFaceCustom(
  $fontName: $fontName,
  $fontId: $fontId,
  $style: $style,
  $display: $display,
  $weight: $weight,
  $woff2Path: $woff2Path,
  $woffPath: $woffPath,
  $unicodeRange: $unicodeRange,
  $unicodeRangeValues: $unicodeRangeValues
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
  `$fontName: "<%= fontName %>" !default;
$fontId: "<%= fontId %>" !default;
$style: normal !default;
$display: swap !default;
$weight: 400 !default;
$fontDir: "~@fontsource/#{$fontId}/files" !default;
$woff2Path: "#{$fontDir}/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff2" !default;
$woffPath: "#{$fontDir}/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff" !default;
$unicodeRange: false !default;
$unicodeRangeValues: null !default;

@mixin fontFaceCustom(
  $fontName: $fontName,
  $fontId: $fontId,
  $style: $style,
  $display: $display,
  $weight: $weight,
  $woff2Path: $woff2Path,
  $woffPath: $woffPath,
  $unicodeRange: $unicodeRange,
  $unicodeRangeValues: $unicodeRangeValues
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
