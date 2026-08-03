import { batch, type ObservableObject } from '@legendapp/state';
import { observer, useObservable, useValue } from '@legendapp/state/react';
import {
	Drawer,
	SegmentedControl,
	Slider,
	VisuallyHidden,
} from '@mantine/core';
import {
	IconAdjustmentsHorizontal,
	IconAlignCenter,
	IconAlignLeft,
	IconAlignRight,
	IconItalic,
	IconSearch,
} from '@tabler/icons-react';
import {
	type CSSProperties,
	createContext,
	useContext,
	useEffect,
	useMemo,
} from 'react';
import { Link } from 'react-router';

import { DropdownSimple } from '@/components/Dropdown';
import {
	FamilyActions,
	FamilyIdentity,
	FamilyTabs,
} from '@/components/font-page/FamilyPageShell';
import { IconRotate } from '@/components/icons';
import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetRegistrySourceCapabilitiesResponse,
	GetVariableFontResponse,
	ListRegistryAxesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { getAxisLabel } from '@/utils/font-labels';
import {
	getFontFamilyStack,
	getFontPreviewFamily,
	getPreferredPreviewSubset,
	getPreviewDirection,
	getPreviewLanguageTag,
	getRegistrySourcePreviewCSS,
	isLatinPreviewSubset,
	registrySourcePreviewFamily,
	selectRegistryPreviewSource,
} from '@/utils/font-preview';
import { saveFontPreviewSelection } from '@/utils/font-preview-selection';
import { getPreviewText as getLanguagePreviewText } from '@/utils/language/language';
import {
	findUnmappedCharacters,
	getOpenTypeFeatureDescription,
	getOpenTypeFeatureName,
	getRegistryFamilyKind,
	getRegistryPreviewText,
	type RegistryDataState,
	type RegistryFamily,
	type RegistrySource,
	usesNameLigatures,
} from '@/utils/registry';

import classes from './FamilyPreview.module.css';
import { FontSkeleton } from './FontSkeleton';

interface FamilyPreviewProps {
	metadata: GetFontResponse;
	staticCSS: string;
	variable?: GetVariableFontResponse;
	variableCSS?: string;
	versions: GetFontVersionsResponse;
	registry?: RegistryFamily;
	registryState: RegistryDataState;
	languages?: ListRegistryLanguagesResponse;
	axisRegistry?: ListRegistryAxesResponse;
	capabilities?: GetRegistrySourceCapabilitiesResponse;
	capabilitySource?: RegistrySource;
	variableUnavailable?: boolean;
}

type PreviewMode = 'headline' | 'paragraph' | 'waterfall' | 'compare';
type PreviewAlignment = 'start' | 'center' | 'end';
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
	typographyByMode: PreviewTypographyByMode;
	selectedLanguageId: string;
	axisQuery: string;
	featureQuery: string;
	inspectorOpened: boolean;
	handoffUnavailable: boolean;
	capabilitiesBySource: Record<
		string,
		GetRegistrySourceCapabilitiesResponse | null
	>;
	axisValues: Record<string, number>;
	featureValues: Record<string, boolean>;
}

type PreviewEditorState = ObservableObject<PreviewEditorValue>;

interface PreviewEditorModel {
	state$: PreviewEditorState;
	metadata: GetFontResponse;
	staticCSS: string;
	variable?: GetVariableFontResponse;
	variableCSS?: string;
	versions: GetFontVersionsResponse;
	registry?: RegistryFamily;
	languages?: ListRegistryLanguagesResponse;
	axisRegistry?: ListRegistryAxesResponse;
	capabilities?: GetRegistrySourceCapabilitiesResponse;
	previewSubset: string;
	familyKind: ReturnType<typeof getRegistryFamilyKind>;
	isSymbolPreviewFamily: boolean;
	initialTypography: PreviewTypographyByMode;
}

const PreviewEditorContext = createContext<PreviewEditorModel | null>(null);

const usePreviewEditor = () => {
	const model = useContext(PreviewEditorContext);
	if (!model) throw new Error('Preview editor context is unavailable');
	return model;
};

const modeLabels: Array<{ label: string; value: PreviewMode }> = [
	{ label: 'Headline', value: 'headline' },
	{ label: 'Paragraph', value: 'paragraph' },
	{ label: 'Waterfall', value: 'waterfall' },
	{ label: 'Compare', value: 'compare' },
];

const symbolModeLabels = [{ label: 'Symbols', value: 'headline' as const }];

const defaultPreviewText: Record<PreviewMode, string> = {
	headline: 'Make something\nmemorable.',
	paragraph:
		'Good typography makes a page easier to enter, understand, and remember. The right rhythm gives every sentence room to breathe while keeping the reader moving.',
	waterfall: 'Sphinx of black quartz',
	compare: 'A typeface for every context.',
};

const weightNames: Record<number, string> = {
	100: 'Thin',
	200: 'Extra light',
	300: 'Light',
	400: 'Regular',
	500: 'Medium',
	600: 'Semibold',
	700: 'Bold',
	800: 'Extra bold',
	900: 'Black',
};

const excludedFeatureTags = new Set([
	'ccmp',
	'locl',
	'mark',
	'mkmk',
	'rlig',
	'rvrn',
]);
const enabledByDefaultFeatureTags = new Set(['calt', 'clig', 'kern', 'liga']);
const exclusiveFeatureGroups = [
	['lnum', 'onum'],
	['pnum', 'tnum'],
	['subs', 'sups'],
] as const;
const rtlScripts = new Set([
	'Adlm',
	'Arab',
	'Hebr',
	'Mand',
	'Nkoo',
	'Samr',
	'Syrc',
	'Thaa',
]);

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

const nearestWeight = (weights: number[], target: number) =>
	weights.reduce((closest, weight) =>
		Math.abs(weight - target) < Math.abs(closest - target) ? weight : closest,
	);

const formatNumber = (value: number) =>
	Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

const formatPixels = (value: number) => `${formatNumber(value)} px`;

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

const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const getModeText = (
	metadata: GetFontResponse,
	mode: PreviewMode,
	registry?: RegistryFamily,
	languages?: ListRegistryLanguagesResponse,
) => {
	const previewSubset = getPreferredPreviewSubset(metadata, registry);
	const familyKind = getRegistryFamilyKind(registry);
	const registrySample = getRegistryPreviewText(
		registry,
		languages,
		mode === 'paragraph' ? 'long' : 'short',
	);

	if (familyKind === 'symbols') return registrySample ?? '';

	if (familyKind === 'digital') {
		return mode === 'paragraph'
			? 'TEMPERATURE 24.5   DISTANCE 120.8'
			: mode === 'compare'
				? '0123456789'
				: '12:48:36';
	}

	if (registrySample && registry?.sampleText) {
		return registrySample;
	}

	if (familyKind === 'punctuation') {
		return '「ことば」を、心地よく。\n句読点まで、美しく。';
	}

	if (!isLatinPreviewSubset(previewSubset) && registrySample) {
		return registrySample;
	}

	if (!isLatinPreviewSubset(previewSubset) && mode !== 'compare') {
		return getLanguagePreviewText(previewSubset);
	}

	if (metadata.category === 'monospace' && mode === 'headline') {
		return 'const type = "beautiful";';
	}

	return mode === 'compare' ? metadata.family : defaultPreviewText[mode];
};

const createModeTexts = (
	metadata: GetFontResponse,
	registry?: RegistryFamily,
	languages?: ListRegistryLanguagesResponse,
): Record<PreviewMode, string> => ({
	headline: getModeText(metadata, 'headline', registry, languages),
	paragraph: getModeText(metadata, 'paragraph', registry, languages),
	waterfall: getModeText(metadata, 'waterfall', registry, languages),
	compare: getModeText(metadata, 'compare', registry, languages),
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

const getAxisStep = (
	tag: string,
	variable: GetVariableFontResponse | undefined,
	axisRegistry: ListRegistryAxesResponse | undefined,
) => {
	const packageStep = Number(variable?.axes[tag]?.step);
	if (packageStep > 0) return packageStep;
	const precision = axisRegistry?.[tag]?.precision ?? 0;
	return 10 ** -precision;
};

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

	return axes.map((axis) => ({
		...axis,
		name: axisRegistry?.[axis.tag]?.name ?? getAxisLabel(axis.tag),
		description: summarizeDescription(axisRegistry?.[axis.tag]?.description),
		step: getAxisStep(axis.tag, variable, axisRegistry),
	}));
};

const getCurrentTypography = (model: PreviewEditorModel) => {
	const mode = model.state$.mode.get();
	return model.state$.typographyByMode[mode].get();
};

const getActiveSource = (model: PreviewEditorModel) => {
	const { italic, weight } = getCurrentTypography(model);
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

const getActiveAxes = (model: PreviewEditorModel) =>
	getPreviewAxes(getActiveSource(model), model.variable, model.axisRegistry);

const getAdjustableAxes = (model: PreviewEditorModel) =>
	getActiveAxes(model).filter(
		(axis) => axis.tag !== 'wght' && axis.tag !== 'ital',
	);

const getActiveLanguages = (model: PreviewEditorModel) =>
	getVerifiedLanguages(model.languages, getActiveCapabilities(model));

const getActiveFeatureTags = (model: PreviewEditorModel) =>
	model.isSymbolPreviewFamily
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
	model.state$.typographyByMode[mode].set(model.initialTypography[mode]);
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
		model.state$.typographyByMode.set(model.initialTypography);
		resetAxes(model);
		resetFeatures(model);
	});
};

const RangeControl = ({
	id,
	label,
	tag,
	description,
	value,
	min,
	max,
	step,
	onChange,
	formatValue = formatNumber,
	unit,
	marks,
	restrictToMarks = false,
	disabled = false,
}: {
	id: string;
	label: string;
	tag?: string;
	description?: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
	formatValue?: (value: number) => string;
	unit?: string;
	marks?: Array<{ value: number }>;
	restrictToMarks?: boolean;
	disabled?: boolean;
}) => {
	const descriptionId = description ? `${id}-description` : undefined;
	const unitId = unit ? `${id}-unit` : undefined;
	const describedBy = [descriptionId, unitId].filter(Boolean).join(' ');
	const setValue = (nextValue: number) => {
		if (!Number.isFinite(nextValue)) return;
		onChange(clamp(nextValue, min, max));
	};

	return (
		<div className={classes.rangeControl}>
			<div className={classes.rangeHeading}>
				<div className={classes.rangeLabel}>
					<label htmlFor={`${id}-value`}>{label}</label>
					{tag && <code>{tag}</code>}
				</div>
				<div className={classes.numberField}>
					<input
						id={`${id}-value`}
						className={classes.numberInput}
						type="number"
						inputMode="decimal"
						min={min}
						max={max}
						step={step}
						value={formatNumber(value)}
						aria-describedby={describedBy || undefined}
						data-unit={unit || undefined}
						disabled={disabled}
						onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
					/>
					{unit && <span id={unitId}>{unit}</span>}
				</div>
			</div>
			{description && (
				<p id={descriptionId} className={classes.controlDescription}>
					{description}
				</p>
			)}
			<Slider
				classNames={{ root: classes.slider, bar: classes.sliderBar }}
				color="purple.0"
				size="xs"
				thumbSize={16}
				thumbLabel={label}
				thumbValueText={(currentValue) => formatValue(currentValue)}
				label={formatValue}
				min={min}
				max={max}
				step={step}
				marks={marks}
				restrictToMarks={restrictToMarks}
				value={value}
				disabled={disabled}
				onChange={setValue}
			/>
		</div>
	);
};

const PreviewRuntimeEffects = observer(() => {
	const model = usePreviewEditor();
	const activeSource = useValue(() => getActiveSource(model));
	const capabilitiesBySource = useValue(model.state$.capabilitiesBySource);
	const adjustableAxes = useValue(() => getAdjustableAxes(model));
	const activeAxes = useValue(() => getActiveAxes(model));
	const verifiedLanguages = useValue(() => getActiveLanguages(model));
	const featureTags = useValue(() => getActiveFeatureTags(model));
	const mode = useValue(model.state$.mode);
	const typography = useValue(model.state$.typographyByMode[mode]);
	const selectedLanguageId = useValue(model.state$.selectedLanguageId);
	const axisValues = useValue(model.state$.axisValues);
	const hasCachedCapabilities = activeSource
		? Object.hasOwn(capabilitiesBySource, activeSource.sha256)
		: false;

	useEffect(() => {
		if (!activeSource || hasCachedCapabilities) return;
		const controller = new AbortController();
		let current = true;
		let capabilitiesUrl: URL;

		try {
			capabilitiesUrl = new URL(
				activeSource.capabilitiesUrl,
				'https://api.fontsource.org',
			);
		} catch {
			model.state$.capabilitiesBySource.set({
				...model.state$.capabilitiesBySource.peek(),
				[activeSource.sha256]: null,
			});
			return;
		}

		fetch(capabilitiesUrl, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error('Capabilities unavailable');
				return response.json() as Promise<GetRegistrySourceCapabilitiesResponse>;
			})
			.then((sourceCapabilities) => {
				if (!current) return;
				model.state$.capabilitiesBySource.set({
					...model.state$.capabilitiesBySource.peek(),
					[activeSource.sha256]: sourceCapabilities,
				});
			})
			.catch(() => {
				if (!current || controller.signal.aborted) return;
				model.state$.capabilitiesBySource.set({
					...model.state$.capabilitiesBySource.peek(),
					[activeSource.sha256]: null,
				});
			});

		return () => {
			current = false;
			controller.abort();
		};
	}, [activeSource, hasCachedCapabilities, model]);

	useEffect(() => {
		const current = model.state$.axisValues.peek();
		const next = Object.fromEntries(
			adjustableAxes.map((axis) => [
				axis.tag,
				clamp(current[axis.tag] ?? axis.default, axis.min, axis.max),
			]),
		);
		const unchanged =
			Object.keys(current).length === Object.keys(next).length &&
			Object.entries(next).every(([tag, value]) => current[tag] === value);
		if (!unchanged) model.state$.axisValues.set(next);
	}, [adjustableAxes, model]);

	useEffect(() => {
		const weightAxis = activeAxes.find((axis) => axis.tag === 'wght');
		const min = weightAxis?.min ?? Math.min(...model.metadata.weights);
		const max = weightAxis?.max ?? Math.max(...model.metadata.weights);
		const nextWeight = clamp(typography.weight, min, max);
		if (nextWeight !== typography.weight) {
			model.state$.typographyByMode[mode].weight.set(nextWeight);
		}
	}, [activeAxes, mode, model, typography.weight]);

	useEffect(() => {
		if (
			verifiedLanguages.some((language) => language.id === selectedLanguageId)
		) {
			return;
		}
		model.state$.selectedLanguageId.set(
			getPreferredLanguage(verifiedLanguages, model.registry?.primaryLanguage)
				?.id ?? '',
		);
	}, [model, selectedLanguageId, verifiedLanguages]);

	useEffect(() => {
		const values = model.state$.featureValues.peek();
		const missing = featureTags.filter((tag) => values[tag] === undefined);
		if (!missing.length) return;
		model.state$.featureValues.set({
			...values,
			...Object.fromEntries(
				missing.map((tag) => [tag, enabledByDefaultFeatureTags.has(tag)]),
			),
		});
	}, [featureTags, model]);

	useEffect(() => {
		const saved = saveFontPreviewSelection(model.metadata.id, {
			format:
				model.variable && model.versions.latestVariable ? 'variable' : 'static',
			subset: model.previewSubset,
			style: typography.italic ? 'italic' : 'normal',
			weight: typography.weight,
			axes: axisValues,
		});
		if (model.state$.handoffUnavailable.peek() !== !saved) {
			model.state$.handoffUnavailable.set(!saved);
		}
	}, [axisValues, model, typography.italic, typography.weight]);

	return null;
});

const PreviewFontStyle = observer(() => {
	const model = usePreviewEditor();
	const activeSource = useValue(() => getActiveSource(model));
	const packagePreviewFamily = getFontPreviewFamily(
		model.metadata,
		Boolean(model.variable),
	);
	const activePreviewFamily = activeSource
		? `${registrySourcePreviewFamily} ${activeSource.sha256.slice(0, 12)}`
		: packagePreviewFamily;

	return (
		<style
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
			dangerouslySetInnerHTML={{
				__html: [
					model.variableCSS ?? model.staticCSS,
					activeSource
						? getRegistrySourcePreviewCSS(activeSource, activePreviewFamily)
						: '',
				]
					.filter(Boolean)
					.join('\n'),
			}}
		/>
	);
});

const PreviewHandoffNotice = observer(() => {
	const model = usePreviewEditor();
	const unavailable = useValue(model.state$.handoffUnavailable);
	if (!unavailable) return null;
	return (
		<p className={classes.handoffNotice} role="status">
			This browser can’t save your preview settings. The Get font tab will use
			this family’s defaults.
		</p>
	);
});

const PreviewToolbar = observer(() => {
	const model = usePreviewEditor();
	const mode = useValue(model.state$.mode);
	const typography = useValue(model.state$.typographyByMode[mode]);
	const selectedLanguageId = useValue(model.state$.selectedLanguageId);
	const verifiedLanguages = useValue(() => getActiveLanguages(model));
	const selectedLanguage = verifiedLanguages.find(
		(language) => language.id === selectedLanguageId,
	);
	const previewDirection = selectedLanguage
		? rtlScripts.has(selectedLanguage.script)
			? 'rtl'
			: 'ltr'
		: getPreviewDirection(model.previewSubset);
	const StartAlignmentIcon =
		previewDirection === 'rtl' ? IconAlignRight : IconAlignLeft;
	const EndAlignmentIcon =
		previewDirection === 'rtl' ? IconAlignLeft : IconAlignRight;
	const alignmentOptions = [
		['start', 'Align text to start', StartAlignmentIcon],
		['center', 'Center text', IconAlignCenter],
		['end', 'Align text to end', EndAlignmentIcon],
	] as const;
	const activeModeLabels = model.isSymbolPreviewFamily
		? symbolModeLabels
		: modeLabels;
	const languageItems = verifiedLanguages.map((language) => ({
		label:
			language.autonym && language.autonym !== language.name
				? `${language.preferredName ?? language.name} · ${language.autonym}`
				: (language.preferredName ?? language.name),
		value: language.id,
		isRefined: language.id === selectedLanguageId,
	}));
	const selectLanguage = (languageId: string) => {
		const language = verifiedLanguages.find((item) => item.id === languageId);
		if (!language?.sampleText) return;
		batch(() => {
			model.state$.selectedLanguageId.set(language.id);
			model.state$.texts.set(createLanguageModeTexts(language));
		});
	};

	return (
		<div className={classes.specimenToolbar}>
			{activeModeLabels.length > 1 && (
				<SegmentedControl
					className={classes.modeChooser}
					aria-label="Preview view"
					value={mode}
					data={activeModeLabels}
					onChange={(value) => model.state$.mode.set(value as PreviewMode)}
				/>
			)}
			<div className={classes.toolbarActions}>
				{model.familyKind === 'text' && verifiedLanguages.length > 0 && (
					<div className={classes.languageControl}>
						<DropdownSimple
							label={
								selectedLanguage?.preferredName ??
								selectedLanguage?.name ??
								'Language'
							}
							ariaLabel="Preview language"
							items={languageItems}
							searchable={verifiedLanguages.length > 6}
							refine={selectLanguage}
							w="100%"
							dropdownWidth={280}
						/>
					</div>
				)}
				{!model.isSymbolPreviewFamily && (
					<fieldset className={classes.alignmentControl}>
						<VisuallyHidden component="legend">
							Preview text alignment
						</VisuallyHidden>
						{alignmentOptions.map(([value, label, Icon]) => (
							<button
								key={value}
								type="button"
								aria-label={label}
								aria-pressed={typography.alignment === value}
								onClick={() =>
									updateCurrentTypography(model, { alignment: value })
								}
							>
								<Icon aria-hidden size={17} stroke={1.8} />
							</button>
						))}
					</fieldset>
				)}
				<button
					type="button"
					className={classes.adjustButton}
					onClick={() => model.state$.inspectorOpened.set(true)}
				>
					<IconAdjustmentsHorizontal aria-hidden size={18} stroke={1.8} />
					Settings
				</button>
			</div>
		</div>
	);
});

const PreviewCanvas = observer(() => {
	const model = usePreviewEditor();
	const mode = useValue(model.state$.mode);
	const activeText = useValue(model.state$.texts[mode]);
	const typography = useValue(model.state$.typographyByMode[mode]);
	const axisValues = useValue(model.state$.axisValues);
	const featureValues = useValue(model.state$.featureValues);
	const selectedLanguageId = useValue(model.state$.selectedLanguageId);
	const activeSource = useValue(() => getActiveSource(model));
	const featureTags = useValue(() => getActiveFeatureTags(model));
	const verifiedLanguages = useValue(() => getActiveLanguages(model));
	const selectedLanguage = verifiedLanguages.find(
		(language) => language.id === selectedLanguageId,
	);
	const packagePreviewFamily = getFontPreviewFamily(
		model.metadata,
		Boolean(model.variable),
	);
	const activePreviewFamily = activeSource
		? `${registrySourcePreviewFamily} ${activeSource.sha256.slice(0, 12)}`
		: packagePreviewFamily;
	const fontFamily = activeSource
		? `${JSON.stringify(activePreviewFamily)}, "Fallback Outline"`
		: getFontFamilyStack(
				model.metadata,
				Boolean(model.variable),
				model.registry,
			);
	const previewDirection = selectedLanguage
		? rtlScripts.has(selectedLanguage.script)
			? 'rtl'
			: 'ltr'
		: getPreviewDirection(model.previewSubset);
	const previewLanguage = getPreviewLanguageTag(selectedLanguage);
	const hasNamedLigatures = usesNameLigatures(model.registry);
	const featureSettings = [
		...featureTags.map((tag) => `"${tag}" ${featureValues[tag] ? 1 : 0}`),
		...(hasNamedLigatures && !featureTags.includes('liga') ? ['"liga" 1'] : []),
	].join(', ');
	const variationSettings = Object.entries(axisValues)
		.map(([axis, value]) => `"${axis}" ${value}`)
		.join(', ');
	const previewStyle = {
		'--preview-size': `${typography.size}px`,
		fontFamily,
		fontWeight: typography.weight,
		fontStyle: typography.italic ? 'italic' : 'normal',
		letterSpacing: `${typography.tracking}px`,
		lineHeight: typography.lineHeight,
		textAlign: typography.alignment,
		fontFeatureSettings: featureSettings || undefined,
		fontVariationSettings: variationSettings || undefined,
	} as CSSProperties;
	const editorLabel = model.isSymbolPreviewFamily
		? hasNamedLigatures
			? 'Enter a symbol name or character'
			: 'Enter or paste a symbol'
		: 'Type your text';
	const setActiveText = (text: string) => model.state$.texts[mode].set(text);

	const content = (() => {
		if (mode === 'waterfall') {
			const sizes = Array.from(
				new Set(
					[1, 0.72, 0.48, 0.3].map((scale) =>
						Math.max(12, Math.round(typography.size * scale)),
					),
				),
			);
			return (
				<div
					className={classes.derivedCanvas}
					dir={previewDirection}
					lang={previewLanguage}
				>
					<label className={classes.derivedEditor}>
						<span>{editorLabel}</span>
						<input
							type="text"
							value={activeText.replaceAll('\n', ' ')}
							spellCheck={false}
							onChange={(event) => setActiveText(event.currentTarget.value)}
						/>
					</label>
					<div className={classes.waterfall}>
						{sizes.map((previewSize) => (
							<div key={previewSize}>
								<span>{previewSize}</span>
								<p style={{ ...previewStyle, fontSize: previewSize }}>
									{activeText}
								</p>
							</div>
						))}
					</div>
				</div>
			);
		}

		if (mode === 'compare') {
			return (
				<div
					className={classes.derivedCanvas}
					dir={previewDirection}
					lang={previewLanguage}
				>
					<label className={classes.derivedEditor}>
						<span>{editorLabel}</span>
						<input
							type="text"
							value={activeText.replaceAll('\n', ' ')}
							spellCheck={false}
							onChange={(event) => setActiveText(event.currentTarget.value)}
						/>
					</label>
					<FontSkeleton
						name="font-detail-weight-strip"
						family={packagePreviewFamily}
						weights={model.metadata.weights}
						className={classes.compareSkeleton}
					>
						<div className={classes.compareGrid}>
							{model.metadata.weights.map((value) => (
								<button
									key={value}
									type="button"
									data-active={typography.weight === value || undefined}
									aria-pressed={typography.weight === value}
									onClick={() =>
										updateCurrentTypography(model, { weight: value })
									}
								>
									<span>
										{weightNames[value] ?? 'Weight'} {value}
									</span>
									<strong
										style={{
											...previewStyle,
											fontFamily: getFontFamilyStack(
												model.metadata,
												Boolean(model.variable),
												model.registry,
											),
											fontWeight: value,
											fontSize: typography.size,
										}}
									>
										{activeText}
									</strong>
								</button>
							))}
						</div>
					</FontSkeleton>
				</div>
			);
		}

		return (
			<label className={classes.canvasField} data-mode={mode}>
				<span>{editorLabel}</span>
				<textarea
					className={classes.canvas}
					rows={mode === 'paragraph' ? 6 : 3}
					style={previewStyle}
					dir={previewDirection}
					lang={previewLanguage}
					value={activeText}
					spellCheck={false}
					onChange={(event) => setActiveText(event.currentTarget.value)}
				/>
			</label>
		);
	})();

	return (
		<FontSkeleton
			name="font-detail-canvas"
			family={activePreviewFamily}
			weight={typography.weight}
			style={typography.italic ? 'italic' : 'normal'}
			className={classes.canvasSkeleton}
		>
			{content}
		</FontSkeleton>
	);
});

const PreviewInspectorHeader = observer(
	({ embedded }: { embedded: boolean }) => {
		const model = usePreviewEditor();
		const typographyByMode = useValue(model.state$.typographyByMode);
		const axisValues = useValue(model.state$.axisValues);
		const featureValues = useValue(model.state$.featureValues);
		const adjustableAxes = useValue(() => getAdjustableAxes(model));
		const featureTags = useValue(() => getActiveFeatureTags(model));
		const typographyChanged = modeLabels.some(
			({ value }) =>
				!typographyMatches(
					typographyByMode[value],
					model.initialTypography[value],
				),
		);
		const axesChanged = adjustableAxes.some(
			(axis) => (axisValues[axis.tag] ?? axis.default) !== axis.default,
		);
		const featuresChanged = featureTags.some(
			(tag) =>
				Boolean(featureValues[tag]) !== enabledByDefaultFeatureTags.has(tag),
		);
		const changed = typographyChanged || axesChanged || featuresChanged;

		return embedded ? (
			<div className={classes.inspectorHeading}>
				<div>
					<h2>Preview settings</h2>
					<p>Size, weight, and spacing stay with each view.</p>
				</div>
				<button
					type="button"
					aria-label="Reset preview styling"
					disabled={!changed}
					onClick={() => resetStyling(model)}
				>
					<IconRotate aria-hidden height={15} />
					Reset styling
				</button>
			</div>
		) : (
			<div className={classes.drawerReset}>
				<button
					type="button"
					aria-label="Reset preview styling"
					disabled={!changed}
					onClick={() => resetStyling(model)}
				>
					<IconRotate aria-hidden height={15} />
					Reset styling
				</button>
			</div>
		);
	},
);

const PreviewTypographyControls = observer(
	({ idPrefix }: { idPrefix: string }) => {
		const model = usePreviewEditor();
		const mode = useValue(model.state$.mode);
		const typography = useValue(model.state$.typographyByMode[mode]);
		const activeAxes = useValue(() => getActiveAxes(model));
		const weightAxis = activeAxes.find((axis) => axis.tag === 'wght');
		const weightMin = weightAxis?.min ?? Math.min(...model.metadata.weights);
		const weightMax = weightAxis?.max ?? Math.max(...model.metadata.weights);
		const changed = !typographyMatches(
			typography,
			model.initialTypography[mode],
		);

		return (
			<section className={classes.inspectorSection}>
				<div className={classes.sectionHeading}>
					<h3>Typography</h3>
					<button
						type="button"
						aria-label="Reset typography settings"
						disabled={!changed}
						onClick={() => resetCurrentTypography(model)}
					>
						Reset
					</button>
				</div>
				<RangeControl
					id={`${idPrefix}-size`}
					label="Font size"
					value={typography.size}
					min={8}
					max={300}
					step={1}
					formatValue={formatPixels}
					unit="px"
					onChange={(size) => updateCurrentTypography(model, { size })}
				/>
				<RangeControl
					id={`${idPrefix}-weight`}
					label="Weight"
					value={typography.weight}
					min={weightMin}
					max={weightMax}
					step={weightAxis?.step ?? 1}
					marks={
						weightAxis
							? undefined
							: model.metadata.weights.map((value) => ({ value }))
					}
					restrictToMarks={!weightAxis && model.metadata.weights.length > 1}
					disabled={weightMin === weightMax}
					onChange={(weight) => updateCurrentTypography(model, { weight })}
				/>
				{model.metadata.styles.includes('italic') && (
					<div className={classes.segmentedField}>
						<span>Style</span>
						<SegmentedControl
							fullWidth
							aria-label="Font style"
							value={typography.italic ? 'italic' : 'normal'}
							data={[
								{ label: 'Normal', value: 'normal' },
								{
									label: (
										<span className={classes.italicLabel}>
											<IconItalic aria-hidden height={16} />
											Italic
										</span>
									),
									value: 'italic',
								},
							]}
							onChange={(value) =>
								updateCurrentTypography(model, {
									italic: value === 'italic',
								})
							}
						/>
					</div>
				)}
				{!model.isSymbolPreviewFamily && (
					<>
						<RangeControl
							id={`${idPrefix}-tracking`}
							label="Letter spacing"
							value={typography.tracking}
							min={-10}
							max={40}
							step={0.5}
							formatValue={formatPixels}
							unit="px"
							onChange={(tracking) =>
								updateCurrentTypography(model, { tracking })
							}
						/>
						<RangeControl
							id={`${idPrefix}-line-height`}
							label="Line height"
							value={Number(
								(typography.size * typography.lineHeight).toFixed(1),
							)}
							min={Number((typography.size * 0.75).toFixed(1))}
							max={Number((typography.size * 2).toFixed(1))}
							step={0.5}
							formatValue={formatPixels}
							unit="px"
							onChange={(value) =>
								updateCurrentTypography(model, {
									lineHeight: value / typography.size,
								})
							}
						/>
					</>
				)}
			</section>
		);
	},
);

const PreviewAxisControls = observer(({ idPrefix }: { idPrefix: string }) => {
	const model = usePreviewEditor();
	const adjustableAxes = useValue(() => getAdjustableAxes(model));
	const axisValues = useValue(model.state$.axisValues);
	const axisQuery = useValue(model.state$.axisQuery);
	if (!adjustableAxes.length) return null;
	const query = normalizeSearchValue(axisQuery);
	const filteredAxes = query
		? adjustableAxes.filter((axis) =>
				normalizeSearchValue(
					`${axis.name} ${axis.tag} ${axis.description ?? ''}`,
				).includes(query),
			)
		: adjustableAxes;
	const changed = adjustableAxes.some(
		(axis) => (axisValues[axis.tag] ?? axis.default) !== axis.default,
	);

	return (
		<section className={classes.inspectorSection}>
			<div className={classes.sectionHeading}>
				<div>
					<h3>Variable axes</h3>
					<span>
						{adjustableAxes.length}{' '}
						{adjustableAxes.length === 1 ? 'axis' : 'axes'}
					</span>
				</div>
				<button
					type="button"
					aria-label="Reset variable axes"
					disabled={!changed}
					onClick={() => resetAxes(model)}
				>
					Reset
				</button>
			</div>
			{adjustableAxes.length > 6 && (
				<label className={classes.inspectorSearch}>
					<IconSearch aria-hidden size={16} stroke={1.75} />
					<VisuallyHidden>Search variable axes</VisuallyHidden>
					<input
						type="search"
						autoComplete="off"
						placeholder="Search by name or tag"
						value={axisQuery}
						onChange={(event) =>
							model.state$.axisQuery.set(event.currentTarget.value)
						}
					/>
				</label>
			)}
			<div className={classes.controlList}>
				{filteredAxes.map((axis) => (
					<RangeControl
						key={axis.tag}
						id={`${idPrefix}-axis-${axis.tag}`}
						label={axis.name}
						tag={axis.tag}
						description={axis.description}
						value={axisValues[axis.tag] ?? axis.default}
						min={axis.min}
						max={axis.max}
						step={axis.step}
						onChange={(value) =>
							model.state$.axisValues.set({
								...model.state$.axisValues.peek(),
								[axis.tag]: value,
							})
						}
					/>
				))}
				{filteredAxes.length === 0 && (
					<p className={classes.emptyState} role="status">
						No variable axes match “{axisQuery}”.
					</p>
				)}
			</div>
		</section>
	);
});

const PreviewFeatureControls = observer(
	({ idPrefix }: { idPrefix: string }) => {
		const model = usePreviewEditor();
		const featureTags = useValue(() => getActiveFeatureTags(model));
		const featureValues = useValue(model.state$.featureValues);
		const featureQuery = useValue(model.state$.featureQuery);
		if (!featureTags.length) return null;
		const query = normalizeSearchValue(featureQuery);
		const filteredFeatures = query
			? featureTags.filter((tag) =>
					normalizeSearchValue(
						`${getOpenTypeFeatureName(tag)} ${tag} ${getOpenTypeFeatureDescription(tag)}`,
					).includes(query),
				)
			: featureTags;
		const changed = featureTags.some(
			(tag) =>
				Boolean(featureValues[tag]) !== enabledByDefaultFeatureTags.has(tag),
		);
		const toggleFeature = (tag: string) => {
			const values = model.state$.featureValues.peek();
			const enabled = !values[tag];
			const next = { ...values, [tag]: enabled };
			if (enabled) {
				for (const group of exclusiveFeatureGroups) {
					if (!(group as readonly string[]).includes(tag)) continue;
					for (const peer of group) {
						if (peer !== tag) next[peer] = false;
					}
				}
			}
			model.state$.featureValues.set(next);
		};

		return (
			<section className={classes.inspectorSection}>
				<div className={classes.sectionHeading}>
					<div>
						<h3>OpenType features</h3>
						<span>Ligatures, alternates, and number styles</span>
					</div>
					<button
						type="button"
						aria-label="Reset OpenType features"
						disabled={!changed}
						onClick={() => resetFeatures(model)}
					>
						Reset
					</button>
				</div>
				{featureTags.length > 8 && (
					<label className={classes.inspectorSearch}>
						<IconSearch aria-hidden size={16} stroke={1.75} />
						<VisuallyHidden>Search OpenType features</VisuallyHidden>
						<input
							type="search"
							autoComplete="off"
							placeholder="Search by name or tag"
							value={featureQuery}
							onChange={(event) =>
								model.state$.featureQuery.set(event.currentTarget.value)
							}
						/>
					</label>
				)}
				<ul className={classes.featureList}>
					{filteredFeatures.map((tag) => {
						const descriptionId = `${idPrefix}-feature-${tag}-description`;
						return (
							<li key={tag}>
								<label className={classes.featureControl}>
									<span>
										<strong>{getOpenTypeFeatureName(tag)}</strong>
										<code>{tag}</code>
										<small id={descriptionId}>
											{getOpenTypeFeatureDescription(tag)}
										</small>
									</span>
									<input
										type="checkbox"
										role="switch"
										checked={Boolean(featureValues[tag])}
										aria-checked={Boolean(featureValues[tag])}
										aria-describedby={descriptionId}
										onChange={() => toggleFeature(tag)}
									/>
								</label>
							</li>
						);
					})}
				</ul>
				{filteredFeatures.length === 0 && (
					<p className={classes.emptyState} role="status">
						No OpenType features match “{featureQuery}”.
					</p>
				)}
			</section>
		);
	},
);

const PreviewCapabilitiesStatus = observer(() => {
	const model = usePreviewEditor();
	const activeSource = useValue(() => getActiveSource(model));
	const capabilitiesBySource = useValue(model.state$.capabilitiesBySource);
	if (!activeSource) return null;
	const cached = Object.hasOwn(capabilitiesBySource, activeSource.sha256);
	if (!cached) {
		return (
			<p className={classes.capabilitiesStatus}>
				Checking the selected style’s available features…
			</p>
		);
	}
	if (capabilitiesBySource[activeSource.sha256] !== null) return null;

	return (
		<div className={classes.capabilitiesStatus} role="status">
			<span>Some preview options couldn’t load.</span>
			<button
				type="button"
				onClick={() => {
					const next = { ...model.state$.capabilitiesBySource.peek() };
					delete next[activeSource.sha256];
					model.state$.capabilitiesBySource.set(next);
				}}
			>
				Try again
			</button>
		</div>
	);
});

const PreviewInspector = ({
	idPrefix,
	embedded,
}: {
	idPrefix: string;
	embedded: boolean;
}) => (
	<div className={classes.inspectorContent}>
		<PreviewInspectorHeader embedded={embedded} />
		<PreviewTypographyControls idPrefix={idPrefix} />
		<PreviewAxisControls idPrefix={idPrefix} />
		<PreviewFeatureControls idPrefix={idPrefix} />
		<PreviewCapabilitiesStatus />
	</div>
);

const PreviewDrawer = observer(() => {
	const model = usePreviewEditor();
	const opened = useValue(model.state$.inspectorOpened);
	return (
		<Drawer
			opened={opened}
			onClose={() => model.state$.inspectorOpened.set(false)}
			position="bottom"
			size="min(86dvh, 760px)"
			title="Preview settings"
			closeButtonProps={{ 'aria-label': 'Close preview settings' }}
			classNames={{
				content: classes.drawerContent,
				header: classes.drawerHeader,
				body: classes.drawerBody,
			}}
		>
			<PreviewInspector idPrefix="mobile-preview" embedded={false} />
		</Drawer>
	);
});

export const FamilyPreview = ({
	metadata,
	staticCSS,
	variable,
	variableCSS,
	versions,
	registry,
	registryState,
	languages,
	axisRegistry,
	capabilities,
	capabilitySource,
	variableUnavailable = false,
}: FamilyPreviewProps) => {
	const previewSubset = getPreferredPreviewSubset(metadata, registry);
	const usesLatinPreview = registry?.primaryScript
		? registry.primaryScript === 'Latn'
		: isLatinPreviewSubset(previewSubset);
	const familyKind = getRegistryFamilyKind(registry);
	const isSymbolPreviewFamily = familyKind === 'symbols';
	const initialSize =
		metadata.category === 'monospace'
			? 64
			: isSymbolPreviewFamily
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
	const initialWeight = initialWeightAxis
		? clamp(600, initialWeightAxis.min, initialWeightAxis.max)
		: nearestWeight(metadata.weights, 600);
	const regularWeight = initialWeightAxis
		? clamp(400, initialWeightAxis.min, initialWeightAxis.max)
		: nearestWeight(metadata.weights, 400);
	const initialLineHeight = usesLatinPreview ? 0.95 : 1.2;
	const initialTypography = useMemo<PreviewTypographyByMode>(
		() => ({
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
		}),
		[
			familyKind,
			initialLineHeight,
			initialSize,
			initialWeight,
			regularWeight,
			usesLatinPreview,
		],
	);
	const initialVerifiedLanguages = getVerifiedLanguages(
		languages,
		capabilities,
	);
	const initialLanguage = getPreferredLanguage(
		initialVerifiedLanguages,
		registry?.primaryLanguage,
	);
	const state$ = useObservable<PreviewEditorValue>({
		mode: 'headline',
		texts:
			familyKind === 'text' &&
			registry?.primaryScript &&
			registry.primaryScript !== 'Latn' &&
			initialLanguage
				? createLanguageModeTexts(initialLanguage)
				: createModeTexts(metadata, registry, languages),
		typographyByMode: initialTypography,
		selectedLanguageId: initialLanguage?.id ?? '',
		axisQuery: '',
		featureQuery: '',
		inspectorOpened: false,
		handoffUnavailable: false,
		capabilitiesBySource:
			capabilitySource && capabilities
				? { [capabilitySource.sha256]: capabilities }
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
	});
	const model = useMemo<PreviewEditorModel>(
		() => ({
			state$,
			metadata,
			staticCSS,
			variable,
			variableCSS,
			versions,
			registry,
			languages,
			axisRegistry,
			capabilities,
			previewSubset,
			familyKind,
			isSymbolPreviewFamily,
			initialTypography,
		}),
		[
			axisRegistry,
			capabilities,
			familyKind,
			initialTypography,
			isSymbolPreviewFamily,
			languages,
			metadata,
			previewSubset,
			registry,
			state$,
			staticCSS,
			variable,
			variableCSS,
			versions,
		],
	);
	const hasCatalog = Boolean(registry?.symbols);
	const symbolPreviewUnavailable =
		isSymbolPreviewFamily && !registry?.sampleText?.short.trim();

	return (
		<PreviewEditorContext.Provider value={model}>
			<section className={classes.page}>
				<PreviewRuntimeEffects />
				<PreviewFontStyle />
				<div className={classes.workbench}>
					<div className={classes.identityPanel}>
						<div>
							<FamilyIdentity
								metadata={metadata}
								registry={registry}
								variableAvailable={Boolean(variable)}
								compact
							/>
							<Link
								className={classes.licenseSignal}
								to={`/fonts/${metadata.id}/about#license`}
							>
								{registry?.license
									? `${registry.license.id} license`
									: registryState === 'unavailable'
										? 'License details temporarily unavailable'
										: 'License details unavailable'}
							</Link>
						</div>
						<FamilyActions metadata={metadata} compact />
					</div>

					<FamilyTabs metadata={metadata} registry={registry} contained />

					{variableUnavailable && (
						<p className={classes.handoffNotice} role="status">
							Variable controls are temporarily unavailable. You can still
							preview the available styles.
						</p>
					)}

					{symbolPreviewUnavailable && (
						<p className={classes.handoffNotice} role="status">
							Enter or paste a supported symbol below, or{' '}
							<Link to={`/fonts/${metadata.id}/glyphs`}>
								{hasCatalog
									? 'browse the symbol catalog'
									: 'browse mapped glyphs'}
							</Link>
							.
						</p>
					)}

					<PreviewHandoffNotice />

					<div className={classes.studio}>
						<div className={classes.specimenColumn}>
							<PreviewToolbar />
							<PreviewCanvas />
						</div>

						<aside className={classes.inspector} aria-label="Preview settings">
							<PreviewInspector idPrefix="desktop-preview" embedded />
						</aside>
					</div>
				</div>

				<PreviewDrawer />
			</section>
		</PreviewEditorContext.Provider>
	);
};
