import type {
	FontFileFormat,
	FontStyle,
	VariableAxisKey,
	WebFontFormat,
} from '../types';
import { formatStyle } from './style';

export const generateStaticFilename = (
	familyId: string,
	subset: string,
	weight: number,
	style: FontStyle,
	sliceIndex: number,
	format: FontFileFormat,
): string => {
	const filenameStyle = formatStyle(style);
	const sliceSuffix = sliceIndex > 0 ? `-${sliceIndex}` : '';

	return `${familyId}-${subset}-${weight}-${filenameStyle}${sliceSuffix}.${format}`;
};

export const generateVariableFilename = (
	familyId: string,
	subset: string,
	axisKey: VariableAxisKey,
	style: FontStyle,
	sliceIndex: number,
	format: WebFontFormat,
): string => {
	const filenameStyle = formatStyle(style);
	const sliceSuffix = sliceIndex > 0 ? `-${sliceIndex}` : '';

	return `${familyId}-${subset}-${axisKey.toLowerCase()}-${filenameStyle}${sliceSuffix}.${format}`;
};
