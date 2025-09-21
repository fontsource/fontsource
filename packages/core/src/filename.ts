import type { FontStyle, Format } from './types';

/**
 * Normalizes oblique styles to italic for filename generation.
 */
const normalizeStyleForFilename = (style: FontStyle): 'normal' | 'italic' => {
	return style.startsWith('oblique ')
		? 'italic'
		: (style as 'normal' | 'italic');
};

/**
 * Generates a descriptive filename for a static font variant.
 *
 * e.g., "inter-latin-400-normal.woff2" for static fonts
 * e.g., "inter-latin-400-italic.woff2" for oblique fonts
 * e.g., "noto-sans-jp-japanese-400-normal-1.woff2" for sliced fonts
 */
export const generateStaticFilename = (
	familyId: string,
	subset: string,
	weight: number,
	style: FontStyle,
	sliceIndex: number,
	format: Format,
): string => {
	const displayStyle = normalizeStyleForFilename(style);
	const sliceSuffix = sliceIndex > 0 ? `-${sliceIndex}` : '';

	return `${familyId}-${subset}-${weight}-${displayStyle}${sliceSuffix}.${format}`;
};

/**
 * Generates a descriptive filename for a variable font variant.
 *
 * e.g., "inter-latin-wght-normal.woff2" for variable fonts
 * e.g., "inter-latin-standard-italic.woff2" for variable fonts with standard axes
 * e.g., "inter-latin-full-normal.woff2" for variable fonts with all axes
 * e.g., "inter-latin-grad-italic.woff2" for variable fonts with custom axes
 * e.g., "noto-sans-jp-japanese-wght-normal-1.woff2" for sliced variable fonts
 */
export const generateVariableFilename = (
	familyId: string,
	subset: string,
	axisKey: string,
	style: FontStyle,
	sliceIndex: number,
	format: Format,
): string => {
	const displayStyle = normalizeStyleForFilename(style);
	const sliceSuffix = sliceIndex > 0 ? `-${sliceIndex}` : '';

	return `${familyId}-${subset}-${axisKey}-${displayStyle}${sliceSuffix}.${format}`;
};
