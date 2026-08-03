import { previewText } from '../preview-text';

export const getPreviewText = (subset: string, id?: string) =>
	previewText.language.families[id ?? ''] ??
	previewText.language.subsets[subset] ??
	previewText.language.fallback;
