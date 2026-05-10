import type { FontConfig, FontStyle } from '@fontsource-utils/core';
import type { SourceFontMetadata, VariableAxes } from './catalog';
import { getMetadataSubsetKeys } from './catalog';

export const buildFontConfig = (
	metadata: SourceFontMetadata,
	overrides: { formats: FontConfig['formats']; axes?: VariableAxes },
): FontConfig => ({
	id: metadata.id,
	family: metadata.family,
	subsets: getMetadataSubsetKeys(metadata),
	weights: metadata.weights,
	styles: metadata.styles as FontStyle[],
	unicodeRange: metadata.unicodeRange,
	formats: overrides.formats,
	...(overrides.axes
		? {
				variable: Object.fromEntries(
					Object.entries(overrides.axes).map(([tag, axis]) => [
						tag,
						{
							default: axis.default,
							min: axis.min,
							max: axis.max,
							step: axis.step,
						},
					]),
				),
			}
		: {}),
});
