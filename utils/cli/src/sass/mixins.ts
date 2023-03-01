export const sassMixins = `@use 'sass:list';
@use 'sass:map';
@use 'sass:math';
@use 'sass:string';
@use 'sass:meta';

@use 'metadata';

$metadata: meta.module-variables(metadata) !default;

$family: map.get($metadata, family) !default;
$styles: map.get($metadata, defaults, style) !default;
$weights: map.get($metadata, defaults, weight) !default;
$display: swap;
$widths: null !default;
$subsets: all !default;
$axes: null !default;
$suffix: null !default;
$directory: '~@fontsource/#{map.get($metadata, id)}/files' !default;

@function face-family($family: $family, $suffix: $suffix, $axis: null) {
  @return string.quote(#{$family if($axis, $suffix, null)});
}

@function face-style($value, $axis: null, $axes: map.get($metadata, axes)) {
  @if ($axis == all or $axis == slnt) and map.has-key($axes, slnt) {
    @return oblique map.get($axes, slnt, min) + deg map.get($axes, slnt, max) +
      deg;
  } @else if meta.type-of($axis) == map {
    @return oblique map.get($axis, min) + deg map.get($axis, max) + deg;
  } @else if $value {
    @return $value;
  }

  @return null;
}

@function face-weight($value, $axis: null, $axes: map.get($metadata, axes)) {
  @if ($axis == all or $axis == wght) and map.has-key($axes, wght) {
    @return map.get($axes, wght, min) map.get($axes, wght, max);
  } @else if meta.type-of($axis) == map {
    @return map.get($axis, min) map.get($axis, max);
  } @else if $value {
    @return $value;
  }

  @return null;
}

@function face-width($value, $axis: null, $axes: map.get($metadata, axes)) {
  @if ($axis == all or $axis == wdth) and map.has-key($axes, wdth) {
    @return math.percentage(math.div(map.get($axes, wdth, min), 100))
      math.percentage(math.div(map.get($axes, wdth, max), 100));
  } @else if meta.type-of($axis) == map {
    @return math.percentage(math.div(map.get($axis, min), 100))
      math.percentage(math.div(map.get($axis, wdth, max), 100));
  } @else if $value {
    @return $value;
  }

  @return null;
}

@function face-variation($value, $axis: null, $axes: map.get($metadata, axes)) {
  @if ($axis == all or $axis == ital) and map.has-key($axes, ital) {
    @return 'ital' 1;
  } @else if meta.type-of($axis) == map {
    @return 'ital' map.get($axis, max);
  } @else if $value {
    @return $value;
  }

  @return null;
}

@function face-glyphs($subset, $subsets: map.get($metadata, subsets)) {
  @if meta.type-of($subset) == map {
    @return $subset;
  } @else if map.has-key($subsets, $subset) {
    @return map.get($subsets, $subset);
  }

  @return null;
}

@function face-source($axis, $subset, $style, $weight, $axes) {
  @if (
    ($axis == all and list.length(map.keys($axes)) > 0) or
      map.has-key($axes, $axis)
  ) {
    @return url('#{path($axis: $axis, $style: $style, $subset: $subset, $format: woff2)}')
        format('woff2 supports variations'),
      url('#{path($axis: $axis, $style: $style, $subset: $subset, $format: woff2)}')
        format('woff2-variations');
  } @else {
    @return url('#{path($weight: $weight, $style: $style, $subset: $subset, $format: woff2)}')
        format('woff2'),
      url('#{path($weight: $weight, $style: $style, $subset: $subset, $format: woff)}')
        format('woff');
  }
}

@function path(
  $axis: null,
  $format: woff2,
  $weight: map.get($metadata, defaults, weight),
  $style: map.get($metadata, defaults, style),
  $subset: map.get($metadata, defaults, subset),
  $id: map.get($metadata, id),
  $directory: $directory
) {
  @if $axis {
    @return '#{$directory}/#{$id}-#{$subset}-variable-#{if($axis == all, 'full', $axis + 'Only')}-#{$style}.#{$format}';
  } @else {
    @return '#{$directory}/#{$id}-#{$subset}-#{$weight}-#{$style}.#{$format}';
  }
}

@mixin generator(
  $family: $family,
  $styles: $styles,
  $weights: $weights,
  $display: $display,
  $widths: $widths,
  $subsets: $subsets,
  $axes: $axes,
  $suffix: $suffix,
  $metadata: $metadata
) {
  @each $axis, $metrics in $axes {
    @each $style
      in if(
        $axis,
        map.get($metadata, defaults, style),
        if($styles == all, map.get($metadata, styles), $styles)
      )
    {
      @each $weight
        in if(
          $axis,
          map.get($metadata, defaults, weight),
          if($weights == all, map.get($metadata, weights), $weights)
        )
      {
        @each $width
          in if(
            $axis,
            map.get($metadata, defaults, width),
            if($widths == all, map.get($metadata, widths), $widths)
          )
        {
          @each $subset,
            $glyphs
              in if(
                $subsets == all,
                map.keys(map.get($metadata, subsets)),
                $subsets
              )
          {
            @each $glyphs in face-glyphs($subset: if($glyphs, $glyphs, $subset))
            {
              @content ((
                family: $family,
                styles: $styles,
                weights: $weights,
                widths: $widths,
                subsets: $subsets,
                axes: $axes,
                suffix: $suffix,
                metadata: $metadata,

                axis: $axis,
                metrics: $metrics,
                style: $style,
                weight: $weight,
                width: $width,
                subset: $subset,
                glyphs: $glyphs,

                font-family: face-family($family: $family, $suffix: $suffix, $axis: $axis),
                font-style: face-style($value: $style, $axis: if($axis == slnt and $metrics, $metrics, $axis)),
                font-weight: face-weight($value: $weight, $axis: if($axis == slnt and $metrics, $metrics, $axis)),
                font-stretch: face-width($value: $width, $axis: if($axis == wdth and $metrics, $metrics, $axis)),
                font-variation-settings: face-variation($value: null, $axis: if($axis == ital and $metrics, $metrics, $axis)),
                src: face-source($axis: $axis, $subset: $subset, $style: $style, $weight: $weight, $axes: map.get($metadata, axes)),
                unicode-range: $glyphs,
              ));
            }
          }
        }
      }
    }
  }
}

@mixin faces(
  $family: $family,
  $styles: $styles,
  $weights: $weights,
  $display: $display,
  $widths: $widths,
  $subsets: $subsets,
  $axes: $axes,
  $suffix: $suffix,
  $metadata: $metadata
) {
  @include generator(
      $family: $family,
      $styles: $styles,
      $weights: $weights,
      $display: $display,
      $widths: $widths,
      $subsets: $subsets,
      $axes: $axes,
      $suffix: $suffix,
      $metadata: $metadata
    )
    using ($data) {
    /* #{map.get($data, family), map.get($data, style), map.get($data, weight), map.get($data, width)} (Subset: #{map.get($data, subset)}, Axis: #{map.get($data, axis)}) */
    @font-face {
      font-family: map.get($data, font-family);
      font-style: map.get($data, font-style);
      font-weight: map.get($data, font-weight);
      font-stretch: map.get($data, font-stretch);
      font-variation-settings: map.get($data, font-variation-settings);
      unicode-range: map.get($data, unicode-range);
      src: map.get($data, src);
    }
  }
}
`;
