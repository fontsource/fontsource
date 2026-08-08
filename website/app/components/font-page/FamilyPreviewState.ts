import { batch, type ObservableObject } from '@legendapp/state';

import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetRegistryFamilySymbolsResponse,
	GetRegistrySourceCapabilitiesResponse,
	GetVariableFontResponse,
	ListRegistryAxesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { getAxisLabel } from '@/utils/font-labels';
import {
	getPreferredPreviewSubset,
	isLatinPreviewSubset,
	selectRegistryPreviewSource,
} from '@/utils/font-preview';
import { getPreviewText as getLanguagePreviewText } from '@/utils/language/language';
import {
	type PreviewMode,
	previewModeOptions,
	previewText,
} from '@/utils/preview-text';
import {
	findUnmappedCharacters,
	getRegistryFamilyKind,
	getRegistryPreviewText,
	getSupportedPreviewFallback,
	type RegistryFamily,
	type RegistrySource,
} from '@/utils/registry';

type PreviewAlignment = 'start' | 'center' | 'end';
type PreviewInspectorSection = 'typography' | 'axes' | 'features';
type RegistryLanguage = ListRegistryLanguagesResponse[number];

interface PreviewTypography {
	size: number;
	weight: number;
	italic: boolean;
	tracking: number;
	lineHeight: number;
	alignment: PreviewAlignment;
}

type PreviewTypographyByMode = Record<PreviewMode, PreviewTypography>;

const cloneTypographyByMode = (
	typographyByMode: PreviewTypographyByMode,
): PreviewTypographyByMode =>
	Object.fromEntries(
		Object.entries(typographyByMode).map(([mode, typography]) => [
			mode,
			{ ...typography },
		]),
	) as PreviewTypographyByMode;

interface PreviewAxis {
	tag: string;
	name: string;
	description?: string;
	min: number;
	max: number;
	default: number;
	step: number;
}

interface PreviewEditorValue {
	mode: PreviewMode;
	texts: Record<PreviewMode, string>;
	sampleTexts: Record<PreviewMode, string>;
	typographyByMode: PreviewTypographyByMode;
	selectedLanguageId: string;
	axisQuery: string;
	featureQuery: string;
	inspectorOpened: boolean;
	inspectorSection: PreviewInspectorSection;
	handoffUnavailable: boolean;
	capabilitiesBySource: Record<
		string,
		GetRegistrySourceCapabilitiesResponse | null
	>;
	verifiedLanguagesBySource: Record<string, RegistryLanguage[]>;
	axisValues: Record<string, number>;
	featureValues: Record<string, boolean>;
}

type PreviewEditorState = ObservableObject<PreviewEditorValue>;

interface PreviewEditorProps {
	metadata: GetFontResponse;
	staticCSS: string;
	variable?: GetVariableFontResponse;
	variableCSS?: string;
	versions: GetFontVersionsResponse;
	registry?: RegistryFamily;
	languages?: ListRegistryLanguagesResponse;
	axisRegistry?: ListRegistryAxesResponse;
	capabilities?: GetRegistrySourceCapabilitiesResponse;
	capabilitySource?: RegistrySource;
	symbols?: GetRegistryFamilySymbolsResponse;
}

interface PreviewEditorModel
	extends Omit<PreviewEditorProps, 'capabilitySource'> {
	state$: PreviewEditorState;
	previewSubset: string;
	familyKind: ReturnType<typeof getRegistryFamilyKind>;
	initialTypography: PreviewTypographyByMode;
}

const modeLabels = previewModeOptions;
const defaultCapabilitiesKey = 'default';

const enabledByDefaultFeatureTags = new Set(['calt', 'clig', 'kern', 'liga']);
const excludedFeatureTags = new Set([
	'ccmp',
	'locl',
	'mark',
	'mkmk',
	'rlig',
	'rvrn',
]);

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

const getAvailableWeights = (weights: number[]) =>
	weights.length > 0 ? weights : [400];

const nearestWeight = (weights: number[], target: number) =>
	weights.reduce((closest, weight) =>
		Math.abs(weight - target) < Math.abs(closest - target) ? weight : closest,
	);

const typographyMatches = (
	current: PreviewTypography,
	initial: PreviewTypography,
) =>
	current.size === initial.size &&
	current.weight === initial.weight &&
	current.italic === initial.italic &&
	current.tracking === initial.tracking &&
	current.lineHeight === initial.lineHeight &&
	current.alignment === initial.alignment;

const summarizeDescription = (value?: string) => {
	const description = value?.trim();
	if (!description) return;
	return description.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim() ?? description;
};

const getModeText = (
	metadata: GetFontResponse,
	mode: PreviewMode,
	registry?: RegistryFamily,
	languages?: ListRegistryLanguagesResponse,
	capabilities?: GetRegistrySourceCapabilitiesResponse,
) => {
	const previewSubset = getPreferredPreviewSubset(metadata, registry);
	const familyKind = getRegistryFamilyKind(registry);
	const registrySample = getRegistryPreviewText(
		registry,
		languages,
		previewText.editor.sampleLengths[mode],
	);

	if (familyKind === 'symbols') {
		return (
			registrySample ??
			getSupportedPreviewFallback(metadata.family, capabilities)
		);
	}
	if (familyKind === 'digital')
		return previewText.editor.familyKinds.digital[mode];
	if (registrySample && registry?.sampleText) return registrySample;
	if (familyKind === 'punctuation')
		return previewText.editor.familyKinds.punctuation[mode];

	const usesLatinPreview = isLatinPreviewSubset(previewSubset);
	if (!usesLatinPreview && registrySample) return registrySample;
	if (!usesLatinPreview && mode !== 'compare') {
		return getLanguagePreviewText(previewSubset);
	}
	if (metadata.category === 'monospace' && mode === 'headline') {
		return previewText.editor.categories.monospace.headline;
	}
	if (mode === 'compare') return metadata.family;
	return previewText.editor.defaults[mode];
};

const createModeTexts = (
	metadata: GetFontResponse,
	registry?: RegistryFamily,
	languages?: ListRegistryLanguagesResponse,
	capabilities?: GetRegistrySourceCapabilitiesResponse,
): Record<PreviewMode, string> => ({
	headline: getModeText(
		metadata,
		'headline',
		registry,
		languages,
		capabilities,
	),
	paragraph: getModeText(
		metadata,
		'paragraph',
		registry,
		languages,
		capabilities,
	),
	waterfall: getModeText(
		metadata,
		'waterfall',
		registry,
		languages,
		capabilities,
	),
	compare: getModeText(metadata, 'compare', registry, languages, capabilities),
});

const createLanguageModeTexts = (
	language: RegistryLanguage,
): Record<PreviewMode, string> => {
	const short = language.sampleText?.short.trim() ?? '';
	const long = language.sampleText?.long?.trim() || short;
	return {
		headline: short,
		paragraph: long,
		waterfall: short,
		compare: short,
	};
};

const getVerifiedLanguages = (
	languages?: ListRegistryLanguagesResponse,
	capabilities?: GetRegistrySourceCapabilitiesResponse,
) => {
	if (!languages || !capabilities) return [];
	return languages.filter((language) => {
		const short = language.sampleText?.short.trim();
		if (!short) return false;
		const samples = [short, language.sampleText?.long?.trim()]
			.filter(Boolean)
			.join(' ');
		return findUnmappedCharacters(samples, capabilities).length === 0;
	});
};

const getPreferredLanguage = (
	languages: RegistryLanguage[],
	primaryLanguage?: string,
) =>
	languages.find((language) => language.id === primaryLanguage) ??
	languages.find(
		(language) =>
			language.id === 'en' ||
			language.id === 'eng' ||
			language.name === 'English',
	) ??
	languages[0];

const getFeatureTags = (
	capabilities?: GetRegistrySourceCapabilitiesResponse,
) =>
	capabilities
		? Array.from(
				new Set([...capabilities.features.gsub, ...capabilities.features.gpos]),
			)
				.filter((tag) => !excludedFeatureTags.has(tag))
				.sort()
		: [];

const getPreviewAxes = (
	source: RegistrySource | undefined,
	variable: GetVariableFontResponse | undefined,
	axisRegistry: ListRegistryAxesResponse | undefined,
): PreviewAxis[] => {
	const sourceAxes = source?.type === 'variable' ? source.axes : [];
	const axes = sourceAxes.length
		? sourceAxes
		: Object.entries(variable?.axes ?? {}).map(([tag, range]) => ({
				tag,
				min: Number(range.min),
				max: Number(range.max),
				default: Number(range.default),
			}));

	return axes.map((axis) => {
		const packageStep = Number(variable?.axes[axis.tag]?.step);
		const precision = axisRegistry?.[axis.tag]?.precision ?? 0;
		return {
			...axis,
			name: axisRegistry?.[axis.tag]?.name ?? getAxisLabel(axis.tag),
			description: summarizeDescription(axisRegistry?.[axis.tag]?.description),
			step: packageStep > 0 ? packageStep : 10 ** -precision,
		};
	});
};

const createPreviewEditorSetup = ({
	metadata,
	variable,
	registry,
	languages,
	axisRegistry,
	capabilities,
	capabilitySource,
}: Pick<
	PreviewEditorProps,
	| 'metadata'
	| 'variable'
	| 'registry'
	| 'languages'
	| 'axisRegistry'
	| 'capabilities'
	| 'capabilitySource'
>) => {
	const previewSubset = getPreferredPreviewSubset(metadata, registry);
	const familyKind = getRegistryFamilyKind(registry);
	const usesLatinPreview = registry?.primaryScript
		? registry.primaryScript === 'Latn'
		: isLatinPreviewSubset(previewSubset);
	const initialSize =
		metadata.category === 'monospace'
			? 64
			: familyKind === 'symbols'
				? 80
				: usesLatinPreview
					? 72
					: 64;
	const initialSourceAxes = getPreviewAxes(
		capabilitySource,
		variable,
		axisRegistry,
	);
	const initialWeightAxis = initialSourceAxes.find(
		(axis) => axis.tag === 'wght',
	);
	const availableWeights = getAvailableWeights(metadata.weights);
	const initialWeight = initialWeightAxis
		? clamp(600, initialWeightAxis.min, initialWeightAxis.max)
		: nearestWeight(availableWeights, 600);
	const regularWeight = initialWeightAxis
		? clamp(400, initialWeightAxis.min, initialWeightAxis.max)
		: nearestWeight(availableWeights, 400);
	const initialLineHeight = usesLatinPreview ? 1.1 : 1.2;
	const initialTypography: PreviewTypographyByMode = {
		headline: {
			size: initialSize,
			weight: initialWeight,
			italic: false,
			tracking: 0,
			lineHeight: initialLineHeight,
			alignment: 'start',
		},
		paragraph: {
			size: familyKind === 'digital' ? 32 : usesLatinPreview ? 24 : 22,
			weight: regularWeight,
			italic: false,
			tracking: 0,
			lineHeight:
				familyKind === 'digital' ? 1.25 : usesLatinPreview ? 1.55 : 1.7,
			alignment: 'start',
		},
		waterfall: {
			size: initialSize,
			weight: initialWeight,
			italic: false,
			tracking: 0,
			lineHeight: Math.max(1.05, initialLineHeight),
			alignment: 'start',
		},
		compare: {
			size: 32,
			weight: regularWeight,
			italic: false,
			tracking: 0,
			lineHeight: 1.15,
			alignment: 'start',
		},
	};
	const verifiedLanguages = getVerifiedLanguages(languages, capabilities);
	const initialLanguage = getPreferredLanguage(
		verifiedLanguages,
		registry?.primaryLanguage,
	);
	const initialTexts =
		familyKind === 'text' &&
		registry?.primaryScript &&
		registry.primaryScript !== 'Latn' &&
		initialLanguage
			? createLanguageModeTexts(initialLanguage)
			: createModeTexts(metadata, registry, languages, capabilities);
	const initialCapabilitySource =
		capabilitySource ??
		selectRegistryPreviewSource(registry, {
			variableAvailable: Boolean(variable),
			style: 'normal',
			weight: initialWeight,
		});
	const capabilitiesKey =
		initialCapabilitySource?.sha256 ?? defaultCapabilitiesKey;
	const editorValue: PreviewEditorValue = {
		mode: 'headline',
		texts: { ...initialTexts },
		sampleTexts: { ...initialTexts },
		typographyByMode: cloneTypographyByMode(initialTypography),
		selectedLanguageId: initialLanguage?.id ?? '',
		axisQuery: '',
		featureQuery: '',
		inspectorOpened: false,
		inspectorSection: 'typography',
		handoffUnavailable: false,
		capabilitiesBySource:
			initialCapabilitySource && capabilities
				? { [initialCapabilitySource.sha256]: capabilities }
				: {},
		verifiedLanguagesBySource: capabilities
			? { [capabilitiesKey]: verifiedLanguages }
			: {},
		axisValues: Object.fromEntries(
			initialSourceAxes
				.filter((axis) => axis.tag !== 'wght' && axis.tag !== 'ital')
				.map((axis) => [axis.tag, axis.default]),
		),
		featureValues: Object.fromEntries(
			getFeatureTags(capabilities).map((tag) => [
				tag,
				enabledByDefaultFeatureTags.has(tag),
			]),
		),
	};

	return { editorValue, familyKind, initialTypography, previewSubset };
};

const getActiveSource = (model: PreviewEditorModel) => {
	const mode = model.state$.mode.get();
	const italic = model.state$.typographyByMode[mode].italic.get();
	const weight = model.state$.typographyByMode[mode].weight.get();
	return selectRegistryPreviewSource(model.registry, {
		variableAvailable: Boolean(model.variable),
		style: italic ? 'italic' : 'normal',
		weight,
	});
};

const getActiveCapabilities = (model: PreviewEditorModel) => {
	const activeSource = getActiveSource(model);
	if (!activeSource) return model.capabilities;
	return (
		model.state$.capabilitiesBySource.get()[activeSource.sha256] ?? undefined
	);
};

const getActiveCapabilitiesKey = (model: PreviewEditorModel) =>
	getActiveSource(model)?.sha256 ?? defaultCapabilitiesKey;

const getActiveAxes = (model: PreviewEditorModel) =>
	getPreviewAxes(getActiveSource(model), model.variable, model.axisRegistry);

const getAdjustableAxes = (model: PreviewEditorModel) =>
	getActiveAxes(model).filter(
		(axis) => axis.tag !== 'wght' && axis.tag !== 'ital',
	);

const getActiveLanguages = (model: PreviewEditorModel) =>
	model.state$.verifiedLanguagesBySource.get()[
		getActiveCapabilitiesKey(model)
	] ?? [];

const getActiveFeatureTags = (model: PreviewEditorModel) =>
	model.familyKind === 'symbols'
		? []
		: getFeatureTags(getActiveCapabilities(model));

const updateCurrentTypography = (
	model: PreviewEditorModel,
	values: Partial<PreviewTypography>,
) => {
	const mode = model.state$.mode.peek();
	model.state$.typographyByMode[mode].assign(values);
};

const resetCurrentTypography = (model: PreviewEditorModel) => {
	const mode = model.state$.mode.peek();
	model.state$.typographyByMode[mode].set({ ...model.initialTypography[mode] });
};

const resetAxes = (model: PreviewEditorModel) => {
	model.state$.axisValues.set(
		Object.fromEntries(
			getAdjustableAxes(model).map((axis) => [axis.tag, axis.default]),
		),
	);
};

const resetFeatures = (model: PreviewEditorModel) => {
	const tags = getActiveFeatureTags(model);
	model.state$.featureValues.set({
		...model.state$.featureValues.peek(),
		...Object.fromEntries(
			tags.map((tag) => [tag, enabledByDefaultFeatureTags.has(tag)]),
		),
	});
};

const resetStyling = (model: PreviewEditorModel) => {
	batch(() => {
		model.state$.typographyByMode.set(
			cloneTypographyByMode(model.initialTypography),
		);
		resetAxes(model);
		resetFeatures(model);
	});
};

export type { PreviewEditorModel, PreviewEditorProps, PreviewInspectorSection };
export {
	clamp,
	createLanguageModeTexts,
	createPreviewEditorSetup,
	enabledByDefaultFeatureTags,
	getActiveAxes,
	getActiveCapabilities,
	getActiveFeatureTags,
	getActiveLanguages,
	getActiveSource,
	getAdjustableAxes,
	getAvailableWeights,
	getPreferredLanguage,
	getVerifiedLanguages,
	modeLabels,
	resetAxes,
	resetCurrentTypography,
	resetFeatures,
	resetStyling,
	typographyMatches,
	updateCurrentTypography,
};
