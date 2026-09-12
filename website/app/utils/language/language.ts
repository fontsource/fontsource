import familyOverrides from '../../../../registry/data/family-overrides.json';
import { previewText } from '../preview-text';

// Search records do not always include the registry's reviewed preview data.
const familySamples = new Map(
	Object.entries(familyOverrides).map(([id, family]) => [
		id,
		'sampleText' in family ? family.sampleText.short : undefined,
	]),
);

export const getPreviewText = (subset: string, familyId?: string) =>
	familySamples.get(familyId ?? '') ??
	previewText.language.subsets[subset] ??
	previewText.language.fallback;
