import type { ObservableObject } from '@legendapp/state';

import type {
	GetFontResponse,
	GetRegistrySourceCapabilitiesResponse,
	GetVariableFontResponse,
	ListRegistryAxesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { getAxisLabel } from '@/utils/font-labels';
import { selectRegistryPreviewSource } from '@/utils/font-preview';
import { getRecommendedPreviewText } from '@/utils/language/language';
import {
	type PreviewMode,
	previewModeOptions,
	previewText,
} from '@/utils/preview-text';
import {
	createRegistryCodepointMatcher,
	getRegistryFamilyKind,
	getSupportedPreviewFallback,
	isRegistryTextSupported,
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
	customText: string | null;
	typographyByMode: PreviewTypographyByMode;
	selectedLanguageId: string;
	axisQuery: string;
	featureQuery: string;
	inspectorOpened: boolean;
	inspectorSection: PreviewInspectorSection;
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
	metadata: Omit<GetFontResponse, 'variants'>;
	previewCSS: string;
	variable?: GetVariableFontResponse;
	registry: RegistryFamily;
	languages: ListRegistryLanguagesResponse;
	axisRegistry?: ListRegistryAxesResponse;
	capabilities: GetRegistrySourceCapabilitiesResponse;
	capabilitySource: RegistrySource;
	symbolNames?: string[];
}

interface PreviewEditorModel
	extends Omit<PreviewEditorProps, 'capabilitySource'> {
	state$: PreviewEditorState;
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

const getActivePreviewText = (model: PreviewEditorModel) => {
	const customText = model.state$.customText.get();
	if (customText !== null) return customText;
	const mode = model.state$.mode.get();
	const languageId = model.state$.selectedLanguageId.get();
	const language = model.languages.find((item) => item.id === languageId);
	const length = previewText.editor.sampleLengths[mode];
	if (model.familyKind === 'symbols' && !model.registry.sampleText) {
		return getSupportedPreviewFallback(
			model.metadata.family,
			model.capabilities,
		);
	}
	return getRecommendedPreviewText(
		{
			...model.metadata,
			...model.registry,
			sampleText: language?.sampleText ?? model.registry.sampleText,
		},
		length,
		model.languages,
	);
};

const getVerifiedLanguages = (
	languages?: ListRegistryLanguagesResponse,
	capabilities?: GetRegistrySourceCapabilitiesResponse,
) => {
	if (!languages || !capabilities) return [];
	const supportsCodepoint = createRegistryCodepointMatcher(capabilities);
	return languages.filter((language) => {
		const short = language.sampleText?.short.trim();
		if (!short) return false;
		return (
			isRegistryTextSupported(short, supportsCodepoint) &&
			isRegistryTextSupported(
				language.sampleText?.long ?? '',
				supportsCodepoint,
			)
		);
	});
};

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
	const familyKind = getRegistryFamilyKind(registry);
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
	const initialTypography: PreviewTypographyByMode = {
		headline: {
			size: 72,
			weight: initialWeight,
			italic: false,
			tracking: 0,
			lineHeight: 1.15,
			alignment: 'start',
		},
		paragraph: {
			size: 24,
			weight: regularWeight,
			italic: false,
			tracking: 0,
			lineHeight: 1.6,
			alignment: 'start',
		},
		waterfall: {
			size: 72,
			weight: initialWeight,
			italic: false,
			tracking: 0,
			lineHeight: 1.15,
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
	const editorValue: PreviewEditorValue = {
		mode: 'headline',
		customText: null,
		typographyByMode: cloneTypographyByMode(initialTypography),
		selectedLanguageId: '',
		axisQuery: '',
		featureQuery: '',
		inspectorOpened: false,
		inspectorSection: 'typography',
		capabilitiesBySource: { [capabilitySource.sha256]: capabilities },
		verifiedLanguagesBySource: {
			[capabilitySource.sha256]: verifiedLanguages,
		},
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

	return { editorValue, familyKind, initialTypography };
};

const getActiveSource = (model: PreviewEditorModel) => {
	const mode = model.state$.mode.get();
	const italic = model.state$.typographyByMode[mode].italic.get();
	// Compare has no selected weight; capabilities use its default reference weight.
	const weight =
		mode === 'compare'
			? model.initialTypography.compare.weight
			: model.state$.typographyByMode[mode].weight.get();
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

export type { PreviewEditorModel, PreviewEditorProps, PreviewInspectorSection };
export {
	clamp,
	createPreviewEditorSetup,
	enabledByDefaultFeatureTags,
	getActiveAxes,
	getActiveCapabilities,
	getActiveFeatureTags,
	getActiveLanguages,
	getActivePreviewText,
	getActiveSource,
	getAdjustableAxes,
	getAvailableWeights,
	getVerifiedLanguages,
	modeLabels,
	resetAxes,
	resetCurrentTypography,
	resetFeatures,
	typographyMatches,
	updateCurrentTypography,
};
