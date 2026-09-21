import type {
	GetRegistryFamilyResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { previewText } from '../preview-text';

export const getPreviewText = (subset: string) =>
	previewText.language.subsets[subset] ?? previewText.language.fallback;

export const getRecommendedPreviewLanguage = (
	font: Pick<
		GetRegistryFamilyResponse,
		'sampleText' | 'previewSubset' | 'primaryLanguage' | 'primaryScript'
	> & { defSubset?: string },
	languages: ListRegistryLanguagesResponse,
) => {
	if (font.sampleText || font.previewSubset) return undefined;
	const primaryLanguage = languages.find(
		(language) => language.id === font.primaryLanguage && language.sampleText,
	);
	if (primaryLanguage) return primaryLanguage;
	if (
		(font.defSubset && previewText.language.subsets[font.defSubset]) ||
		font.primaryScript === 'Latn'
	) {
		return undefined;
	}
	return languages.find(
		(language) => language.script === font.primaryScript && language.sampleText,
	);
};

export const getRecommendedPreviewText = (
	font: {
		sampleText?: { short: string; long?: string };
		previewSubset?: string;
		primaryLanguage?: string;
		primaryScript?: string;
		defSubset: string;
	},
	length: 'short' | 'long' = 'short',
	languages: ListRegistryLanguagesResponse = [],
) => {
	const sample =
		font.sampleText ??
		getRecommendedPreviewLanguage(font, languages)?.sampleText;
	return (
		(length === 'long' ? sample?.long : undefined)?.trim() ||
		sample?.short.trim() ||
		getPreviewText(font.previewSubset ?? font.defSubset)
	);
};
