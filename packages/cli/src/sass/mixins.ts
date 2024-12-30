export const sassMixins = `@use 'sass:list';
@use 'sass:map';
@use 'sass:math';
@use 'sass:meta';
@use 'sass:string';

@use 'metadata';

$metadata: metadata.$metadata !default;
$directory: null !default;

$family: null !default;
$display: null !default;
$formats: null !default;
$subsets: null !default;
$weights: null !default;
$styles: null !default;
$axes: null !default;

// Deprecated
$displayVar: null !default;

@mixin generator(
  $metadata: $metadata,
  $directory: $directory,
  $family: $family,
  $display: $display,
  $formats: $formats,
  $subsets: $subsets,
  $weights: $weights,
  $styles: $styles,
  $axes: $axes,

  // Deprecated
  $displayVar: $displayVar
) {
	@warn "Importing mixins via the fontsource package is deprecated and will be removed in the next major release. Please use the @fontsource-utils/scss package instead.";

  @if $displayVar != null {
    @warn "$displayVar is deprecated due to the limitation of using css variables in @font-face (https://github.com/fontsource/fontsource/issues/726).";
  }

  $isVariable: map.get($metadata, axes) != null;

  $directory: if(
    $directory,
    $directory,
    '~@fontsource#{if($isVariable, '-variable', '')}/#{map.get($metadata, id)}/files'
  );

  $family: if($family, $family, map.get($metadata, family) + if($isVariable, ' Variable', ''));
  $display: if($display, $display, swap);
  $formats: if(not $formats or $formats == all, if($isVariable, woff2, (woff2, woff)), $formats);
  $subsets: if(
    $subsets,
    if($subsets == all, map.get($metadata, subsets), $subsets),
    map.get($metadata, subsets)
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
    if($isVariable, if(map.has-key($metadata, axes, wght), wght, full), null)
  );

  @each $subset in $subsets {
    @each $unicodeSubset, $unicodeRange in map.get($metadata, unicode) {
      // If condition is true, generate faces for the current subset
      @if (
      	// If there is no unicode information for the font or
        ($unicodeSubset == null) or
        	// If the subset match a unicode subset or
        	($subset == $unicodeSubset) or
						(
							// If $unicodeSubset is a numeric unicode subset
							// and current subset exists in the list of font subsets but does not match any unicode subset
							// then generate faces for this numeric unicode subset as it is representing part of the current subset
							list.index(map.get($metadata, subsets), $subset) and not
								map.has-key($metadata, unicode, $subset) and not
									list.index(map.get($metadata, subsets), $unicodeSubset)
						)
      ) {
        @each $weight in if($axes, null, $weights) {
          @each $axis in $axes {
            @each $style in $styles {
              $variant: '#{map.get($metadata, id)}-#{if($unicodeSubset, $unicodeSubset, $subset)}-#{if($axis, $axis, $weight)}-#{$style}';

              $src: ();
              @each $format in $formats {
                $src: append(
                  $src,
                  url('#{$directory}/#{$variant}.#{$format}')
                    format('#{$format}#{if($axis, '-variations', '')}'),
                  comma
                );
              }

              @content ((
                metadata: $metadata,
                directory: $directory,
                family: $family,
                display: $display,
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
                  (($axis == full) or ($axis == slnt)) and map.has-key($metadata, axes, slnt),
                  oblique map.get($metadata, axes, slnt, min) + deg map.get($metadata, axes, slnt, max) + deg,
                  $style
                ),
                font-display: $display,
                font-weight: if(
                  (($axis == full) or ($axis == wght)) and map.has-key($metadata, axes, wght),
                  map.get($metadata, axes, wght, min) map.get($metadata, axes, wght, max),
                  $weight
                ),
                font-stretch: if(
                  (($axis == full) or ($axis == wdth)) and map.has-key($metadata, axes, wdth),
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
  $formats: $formats,
  $subsets: $subsets,
  $weights: $weights,
  $styles: $styles,
  $axes: $axes,

  // Deprecated
  $displayVar: $displayVar
) {
  @include generator(
      $metadata: $metadata,
      $directory: $directory,
      $family: $family,
      $display: $display,
      $formats: $formats,
      $subsets: $subsets,
      $weights: $weights,
      $styles: $styles,
      $axes: $axes,

      $displayVar: $displayVar
    )
    using ($props) {
    /* #{map.get($props, variant)} */
    @font-face {
      font-family: map.get($props, font-family);
      font-style: map.get($props, font-style);
      font-display: map.get($props, font-display);
      font-weight: map.get($props, font-weight);
      font-stretch: map.get($props, font-stretch);
      unicode-range: map.get($props, unicode-range);
      src: map.get($props, src);
    }
  }
}
`;
