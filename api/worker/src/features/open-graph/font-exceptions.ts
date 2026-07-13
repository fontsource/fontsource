import type { SourceFontMetadata } from '../../../../shared/catalog';

interface OpenGraphFontException {
	iconLigatures?: readonly string[];
	maxSpecimenFontSize?: number;
	previewSubset?: string;
	specimenText?: string;
	useUiTitle?: boolean;
}

interface OpenGraphFontPrefixException extends OpenGraphFontException {
	prefix: string;
}

const DEFAULT_ICON_LIGATURES = ['search', 'favorite', 'check_circle'] as const;

/**
 * Font-specific Open Graph behavior belongs here so catalog quirks and unusual
 * specimen requirements remain easy to discover and update.
 */
const OPEN_GRAPH_FONT_EXCEPTIONS = {
	'dejavu-math': { specimenText: '∑π' },
	'dseg-weather': { specimenText: 'ABC' },
	'libertinus-math': { specimenText: '∑π' },
	'material-symbols': {
		iconLigatures: DEFAULT_ICON_LIGATURES,
		useUiTitle: true,
	},
	'noto-emoji': { specimenText: '😀' },
	'noto-music': {
		maxSpecimenFontSize: 140,
		previewSubset: 'music',
		specimenText: '𝄞𝅘𝅥',
	},
	'noto-sans-math': { specimenText: '⊰⊱⫕' },
	'noto-sans-symbols': {
		previewSubset: 'symbols',
		specimenText: '☯♬⚖',
	},
	'noto-sans-symbols-2': {
		previewSubset: 'mayan-numerals',
		specimenText: '𝋠𝋡𝋢',
	},
	redacted: { useUiTitle: true },
	'redacted-script': { useUiTitle: true },
	'stix-two-math': { specimenText: '∑π' },
	wavefont: { useUiTitle: true },
	yakuhanjp: { specimenText: '、。「」' },
	yakuhanjps: { specimenText: '「」【】' },
	yakuhanmp: { specimenText: '、。「」' },
	yakuhanmps: { specimenText: '「」【】' },
	yakuhanrp: { specimenText: '、。「」' },
	yakuhanrps: { specimenText: '「」【】' },
} as const satisfies Record<string, OpenGraphFontException>;

const OPEN_GRAPH_FONT_PREFIX_EXCEPTIONS = [
	{ prefix: 'dseg7', specimenText: '88' },
	{ prefix: 'dseg14', specimenText: '88' },
	{ prefix: 'flow-', useUiTitle: true },
	{ prefix: 'libre-barcode-', useUiTitle: true },
	{ prefix: 'yarndings-', useUiTitle: true },
] as const satisfies readonly OpenGraphFontPrefixException[];

const getOpenGraphFontException = (
	metadata: SourceFontMetadata,
): OpenGraphFontException | undefined =>
	OPEN_GRAPH_FONT_EXCEPTIONS[
		metadata.id as keyof typeof OPEN_GRAPH_FONT_EXCEPTIONS
	] ??
	OPEN_GRAPH_FONT_PREFIX_EXCEPTIONS.find(({ prefix }) =>
		metadata.id.startsWith(prefix),
	);

export const getOpenGraphIconLigatures = (
	metadata: SourceFontMetadata,
): readonly string[] | undefined => {
	const exception = getOpenGraphFontException(metadata);
	if (exception?.iconLigatures) return exception.iconLigatures;
	return metadata.category === 'icons' ? DEFAULT_ICON_LIGATURES : undefined;
};

export const getOpenGraphPreviewSubset = (
	metadata: SourceFontMetadata,
): string => {
	const previewSubset = getOpenGraphFontException(metadata)?.previewSubset;
	return previewSubset && metadata.subsets.includes(previewSubset)
		? previewSubset
		: metadata.defSubset;
};

export const getOpenGraphSpecimenMaxFontSize = (
	metadata: SourceFontMetadata,
	fallback: number,
): number =>
	getOpenGraphFontException(metadata)?.maxSpecimenFontSize ?? fallback;

export const getOpenGraphSpecimenText = (
	metadata: SourceFontMetadata,
): string => getOpenGraphFontException(metadata)?.specimenText ?? 'Aa';

export const shouldUseOpenGraphPreviewTitle = (
	metadata: SourceFontMetadata,
): boolean =>
	metadata.category !== 'icons' &&
	metadata.category !== 'other' &&
	!getOpenGraphFontException(metadata)?.useUiTitle;
