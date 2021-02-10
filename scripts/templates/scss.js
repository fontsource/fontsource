const _ = require("lodash")

exports.scssMixins = _.template(
  `$fontName: "<%= fontName %>";
$fontId: "<%= fontId %>";
$style: normal;
$display: swap;
$weight: 400;
$fontDir: "~@fontsource/#{$fontId}/files";
$unicodeMap: (<%= unicodeMap %>);

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
      src: url("#{$fontDir}/#{$fontId}-#{$subset}-#{$weight}-#{$style}.woff2") format("woff2"),
        url("#{$fontDir}/#{$fontId}-all-#{$weight}-#{$style}.woff") format("woff");
      unicode-range: $unicodeRangeValues;
    }
  }
}

$defSubset: "<%= defSubset %>";
$woff2Path: "#{$fontDir}/#{$fontId}-#{$defSubset}-#{$weight}-#{$style}.woff2";
$woffPath: "#{$fontDir}/#{$fontId}-#{$defSubset}-#{$weight}-#{$style}.woff";
$unicodeRange: false;
$unicodeRangeValues: (<%= defUnicode %>);

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

<% if (variableFlag) { %>$fontName: "<%= fontName %>Variable";
$weight: <%= variableWeight %>;
$type: "wghtOnly";
$stretch: <%= variableWdth %>;
  
@mixin fontFaceVariable(
  $fontName: $fontName,
  $fontId: $fontId,
  $style: $style,
  $display: $display,
  $weight: $weight,
  $fontDir: $fontDir,
  $type: $type,
  $stretch: $stretch,
  $unicodeMap: $unicodeMap
) {
  @each $subset, $unicodeRangeValues in $unicodeMap {
    @font-face {
      font-family: "#{$fontName}";
      font-style: $style;
      font-display: $display;
      font-weight: $weight;
      @if $type == "full" {
        font-stretch: $stretch;
      }
      src: url("#{$fontDir}/#{$fontId}-#{$subset}-variable-#{$type}-#{$style}.woff2") format("woff2");
      unicode-range: $unicodeRangeValues;
    }
  }
}

$woff2Path: "#{$fontDir}/#{$fontId}-#{$defSubset}-variable-#{$type}-#{$style}.woff2";

@mixin fontFaceVariableCustom(
  $fontName: $fontName,
  $fontId: $fontId,
  $style: $style,
  $display: $display,
  $weight: $weight,
  $woff2Path: $woff2Path,
  $unicodeRange: $unicodeRange,
  $unicodeRangeValues: $unicodeRangeValues
) {
  @font-face {
    font-family: "#{$fontName}";
    font-style: $style;
    font-display: $display;
    font-weight: $weight;
    @if $type == "full" {
      font-stretch: $stretch;
    }
    src: url("#{$woff2Path}") format("woff2");
    @if $unicodeRange {
      unicode-range: $unicodeRangeValues;
    }
  }
}<% } %>
`
)

exports.scssGeneric = _.template(
  `$fontName: "<%= fontName %>";
$fontId: "<%= fontId %>";
$style: normal;
$display: swap;
$weight: 400;
$fontDir: "~@fontsource/#{$fontId}/files";
$woff2Path: "#{$fontDir}/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff2";
$woffPath: "#{$fontDir}/#{$fontId}-<%= defSubset %>-#{$weight}-#{$style}.woff";
$unicodeRange: false;
$unicodeRangeValues: null;

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
