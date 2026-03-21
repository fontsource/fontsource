import type { FontStyle, Format } from './types';

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

	return `${familyId}-${subset}-${axisKey.toLowerCase()}-${displayStyle}${sliceSuffix}.${format}`;
};

export const normalizeStyleForFilename = (
	style: FontStyle,
): 'normal' | 'italic' =>
	style.startsWith('oblique') ? 'italic' : (style as 'normal' | 'italic');
