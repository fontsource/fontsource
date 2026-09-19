import { previewText } from '../preview-text';

export const getPreviewText = (subset: string) =>
	previewText.language.subsets[subset] ?? previewText.language.fallback;
