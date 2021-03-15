const _ = require("lodash")

exports.scssMixins = _.template(
`@use 'sass:map';
$fontName: "<%= fontName %>";
$fontId: "<%= fontId %>";
$style: normal;
$display: swap;
$weight: 400;
$fontDir: "~@fontsource/#{$fontId}/files";
$unicodeMap: (<%= unicodeMap %>);
$defSubset: "<%= defSubset %>";

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
    @include fontFaceCustom(
        $fontName: $fontName,
        $fontId: $fontId,
        $style: $style,
        $display: $display,
        $weight: $weight,
        $fontDir: $fontDir,
        $subset: $subset,
        $unicodeRange: true,
        $unicodeRangeValues: $unicodeRangeValues
      )
  }
}

@mixin fontFaceCustom(
  $fontName: $fontName,
  $fontId: $fontId,
  $style: $style,
  $display: $display,
  $weight: $weight,
  $woff2Path: null,
  $woffPath: null,
  $subset: $defSubset,
  $fontDir: $fontDir,
  $type: null,
  $stretch: null,
  $unicodeRange: false,
  $unicodeRangeValues: map.get($unicodeMap, $subset)  
) {
  $urlBase: "#{$fontDir}/#{$fontId}-#{$subset}-#{if($type == "full", "variable-#{$type}", $weight)}-#{$style}";
  $src: url(if($woff2Path,$woff2Path, "#{$urlBase}.woff2")) format("woff2");
  @if $type != "full" {
      $src: $src + ", " + url(if($woffPath,$woffPath, "#{$urlBase}.woff")) format("woff");
  }
  @font-face {
    font-family: "#{$fontName}";
    font-style: $style;
    font-display: $display;
    font-weight: $weight;
    @if $type == "full" {
        font-stretch: $stretch;
    }
    src: $src;
    @if $unicodeRange {
      unicode-range: $unicodeRangeValues;
    }
  }
}

<% if (variableFlag) { %>
$fontName: "<%= fontName %>Variable";
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
    @include fontFaceCustom(
      $fontName: $fontName,
      $fontId: $fontId,
      $style: $style,
      $display: $display,
      $weight: $weight,
      $fontDir: $fontDir,
      $subset: $subset,
      $type: $type,
      $stretch: $stretch,
      $unicodeRange: true,
      $unicodeRangeValues: $unicodeRangeValues
    )
  }
}

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
    @include fontFaceCustom(
      $fontName: "#{$fontName}",
      $fontId: $fontId,
      $style: $style,
      $display: $display,
      $weight: $weight,
      $subset: $subset,
      $type: $type,
      $stretch: $stretch,
      $woff2Path: $woff2Path,
      $unicodeRange: $unicodeRange,
      $unicodeRangeValues: $unicodeRangeValues
    )
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
$unicodeRange: false;
$unicodeRangeValues: null;
$defSubset: "<%= defSubset %>";

@mixin fontFaceCustom(
  $fontName: $fontName,
  $fontId: $fontId,
  $style: $style,
  $display: $display,
  $weight: $weight,
  $subset: $defSubset,
  $woff2Path: null,
  $woffPath: null,
  $unicodeRange: $unicodeRange,
  $unicodeRangeValues: $unicodeRangeValues
) {
  $urlBase: "#{$fontDir}/#{$fontId}-#{$subset}-#{$weight}-#{$style}";
  @font-face {
    font-family: "#{$fontName}";
    font-style: $style;
    font-display: $display;
    font-weight: $weight;
    src: url(if($woff2Path,$woff2Path, "#{$urlBase}.woff2")) format("woff2") url(if($woffPath,$woffPath, "#{$urlBase}.woff")) format("woff");
    @if $unicodeRange {
      unicode-range: $unicodeRangeValues;
    }
  }
}
`
)
