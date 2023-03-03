export const sassMixins = `@use 'sass:list';
@use 'sass:map';
@use 'sass:math';
@use 'sass:meta';
@use 'sass:string';

@use 'metadata';

$metadata: meta.module-variables(metadata) !default;
$directory: null !default;

$family: null !default;
$display: null !default;
$displayVar: null !default;
$formats: null !default;
$subsets: null !default;
$weights: null !default;
$styles: null !default;
$axes: null !default;

@mixin generator(
  $metadata: $metadata,
  $directory: $directory,
  $family: $family,
  $display: $display,
  $displayVar: $displayVar,
  $formats: $formats,
  $subsets: $subsets,
  $weights: $weights,
  $styles: $styles,
  $axes: $axes
) {
  $directory: if(
    $directory,
    $directory,
    '~@fontsource/#{map.get($metadata, id)}/files'
  );

  $family: if($family, $family, map.get($metadata, family));
  $display: if($display, $display, swap);
  $displayVar: if($displayVar != null, $displayVar, true);
  $formats: if(not $formats or $formats == all, (woff2, woff), $formats);
  $subsets: if(
    $subsets,
    if($subsets == all, map.get($metadata, subsets), $subsets),
    map.get($metadata, defaults, subset)
  );
  $weights: if(
    $weights,
    if($weights == all, map.get($metadata, weights), $weights),
    map.get($metadata, defaults, weight)
  );
  $styles: if(
    $styles,
    if($styles == all, map.get($metadata, styles), $styles),
    map.get($metadata, defaults, style)
  );
  $axes: if(
    $axes,
    if($axes == all, full, $axes),
    if(
      map.get($metadata, axes),
      if(map.has-key($metadata, axes, wght), wght, full),
      null
    )
  );

  @each $subset in $subsets {
    @each $unicodeSubset, $unicodeRange in map.get($metadata, unicode) {
      @if (
        $subset ==
          $unicodeSubset or
          (
            // Is numeric subset
            $subset ==
              map.get($metadata, defaults, subset) and not
              map.has-key($metadata, subsets, $unicodeSubset)
          )
      ) {
        @each $weight in if($axes, null, $weights) {
          @each $axis in $axes {
            @each $style in $styles {
              $variant: '#{map.get($metadata, id)}-#{$unicodeSubset}-#{if($axis, $axis, $weight)}-#{$style}';

              $src: ();
              @each $format in $formats {
                $src: append(
                  $src,
                  url('#{$directory}/#{$variant}.#{$format}')
                    format('#{$format}'),
                  comma
                );
              }

              @content ((
                metadata: $metadata,
                directory: $directory,
                family: $family,
                display: $display,
                displayVar: $displayVar,
                formats: $formats,
                subsets: $subsets,
                weights: $weights,
                styles: $styles,
                axes: $axes,

                variant: $variant,
                subset: $subset,
                unicodeSubset: $unicodeSubset,
                unicodeRange: $unicodeRange,
                weight: $weight,
                axis: $axis,
                style: $style,

                font-family: string.quote($family),
                font-style: if(
                  ($axis == full or $axis == slnt) and map.has-key($metadata, axes, slnt), 
                  oblique map.get($metadata, axes, slnt, min) + deg map.get($metadata, axes, slnt, max) + deg,
                  $style
                ),
                font-display: if($displayVar, var(--fontsource-display, $display), $display),
                font-weight: if(
                  ($axis == full or $axis == wght) and map.has-key($metadata, axes, wght), 
                  map.get($metadata, axes, wght, min) map.get($metadata, axes, wght, max),
                  $weight
                ),
                font-stretch: if(
                  ($axis == full or $axis == wdth) and map.has-key($metadata, axes, wdth), 
                  '#{map.get($metadata, axes, wdth, min)}% #{map.get($metadata, axes, wdth, max)}%',
                  null
                ),
                src: $src,
                unicode-range: $unicodeRange,
              ));
            }
          }
        }
      }
    }
  }
}

@mixin faces(
  $metadata: $metadata,
  $directory: $directory,
  $family: $family,
  $display: $display,
  $displayVar: $displayVar,
  $formats: $formats,
  $subsets: $subsets,
  $weights: $weights,
  $styles: $styles,
  $axes: $axes
) {
  @include generator(
      $metadata: $metadata,
      $directory: $directory,
      $family: $family,
      $display: $display,
      $displayVar: $displayVar,
      $formats: $formats,
      $subsets: $subsets,
      $weights: $weights,
      $styles: $styles,
      $axes: $axes
    )
    using ($data) {
    /* #{map.get($data, variant)} */
    @font-face {
      font-family: map.get($data, font-family);
      font-style: map.get($data, font-style);
      font-display: map.get($data, font-display);
      font-weight: map.get($data, font-weight);
      font-stretch: map.get($data, font-stretch);
      unicode-range: map.get($data, unicode-range);
      src: map.get($data, src);

      @content();
    }
  }
}
`;
