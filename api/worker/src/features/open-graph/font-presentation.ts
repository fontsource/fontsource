import type { SourceFontMetadata } from '../../../../shared/catalog';
import type { RegistryFamilyDetail } from '../../../../shared/registry';

const DEFAULT_ICON_LIGATURES = ['search', 'favorite', 'check_circle'] as const;

export const getOpenGraphIconLigatures = (
	registry: RegistryFamilyDetail,
): readonly string[] | undefined =>
	registry.symbols?.inputModes.includes('name-ligature')
		? DEFAULT_ICON_LIGATURES
		: undefined;

export const getOpenGraphPreviewSubset = (
	metadata: SourceFontMetadata,
	registry: RegistryFamilyDetail,
): string =>
	registry.previewSubset && metadata.subsets.includes(registry.previewSubset)
		? registry.previewSubset
		: metadata.defSubset;

export const getOpenGraphSpecimenMaxFontSize = (
	registry: RegistryFamilyDetail,
	fallback: number,
): number => (registry.id === 'noto-music' ? 140 : fallback);

export const getOpenGraphSpecimenText = (
	registry: RegistryFamilyDetail,
): string => registry.sampleText?.short ?? 'Aa';

export const shouldUseOpenGraphPreviewTitle = (
	metadata: SourceFontMetadata,
	registry: RegistryFamilyDetail,
): boolean =>
	metadata.category !== 'icons' &&
	metadata.category !== 'other' &&
	!registry.classifications.includes('symbols');
