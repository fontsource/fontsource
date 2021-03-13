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
