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
import { useEffect, useMemo, useState } from 'react';
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

interface PreviewAxis {
	tag: string;
	name: string;
	description?: string;
	min: number;
	max: number;
	default: number;
	step: number;
}

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
		'Good typography makes a page easier to enter, understand, and remember.',
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
	marks?: Array<{ value: number }>;
	restrictToMarks?: boolean;
	disabled?: boolean;
}) => {
	const descriptionId = description ? `${id}-description` : undefined;
	const setValue = (nextValue: number) => {
		if (!Number.isFinite(nextValue)) return;
		onChange(clamp(nextValue, min, max));
	};

	return (
		<div className={classes.rangeControl}>
			<div className={classes.rangeHeading}>
				<div>
					<label htmlFor={`${id}-value`}>{label}</label>
					{tag && <code>{tag}</code>}
				</div>
				<input
					id={`${id}-value`}
					className={classes.numberInput}
					type="number"
					inputMode="decimal"
					min={min}
					max={max}
					step={step}
					value={formatNumber(value)}
					aria-describedby={descriptionId}
					disabled={disabled}
					onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
				/>
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
	const hasCatalog = Boolean(registry?.symbols);
	const hasNamedLigatures = usesNameLigatures(registry);
	const familyKind = getRegistryFamilyKind(registry);
	const isSymbolPreviewFamily = familyKind === 'symbols';
	const symbolPreviewUnavailable =
		isSymbolPreviewFamily && !registry?.sampleText?.short.trim();
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
	const initialLineHeight = usesLatinPreview ? 0.95 : 1.2;
	const initialVerifiedLanguages = getVerifiedLanguages(
		languages,
		capabilities,
	);
	const initialLanguage = getPreferredLanguage(
		initialVerifiedLanguages,
		registry?.primaryLanguage,
	);
	const [mode, setMode] = useState<PreviewMode>('headline');
	const [texts, setTexts] = useState(() =>
		familyKind === 'text' &&
		registry?.primaryScript &&
		registry.primaryScript !== 'Latn' &&
		initialLanguage
			? createLanguageModeTexts(initialLanguage)
			: createModeTexts(metadata, registry, languages),
	);
	const [size, setSize] = useState(initialSize);
	const [weight, setWeight] = useState(initialWeight);
	const [italic, setItalic] = useState(false);
	const [tracking, setTracking] = useState(0);
	const [lineHeight, setLineHeight] = useState(initialLineHeight);
	const [alignment, setAlignment] = useState<PreviewAlignment>('start');
	const [selectedLanguageId, setSelectedLanguageId] = useState(
		initialLanguage?.id ?? '',
	);
	const [axisQuery, setAxisQuery] = useState('');
	const [featureQuery, setFeatureQuery] = useState('');
	const [inspectorOpened, setInspectorOpened] = useState(false);
	const [handoffUnavailable, setHandoffUnavailable] = useState(false);
	const [capabilitiesBySource, setCapabilitiesBySource] = useState<
		Record<string, GetRegistrySourceCapabilitiesResponse | null>
	>(() =>
		capabilitySource && capabilities
			? { [capabilitySource.sha256]: capabilities }
			: {},
	);
	const supportsItalic = metadata.styles.includes('italic');
	const activeSource = useMemo(
		() =>
			selectRegistryPreviewSource(registry, {
				variableAvailable: Boolean(variable),
				style: italic ? 'italic' : 'normal',
				weight,
			}),
		[italic, registry, variable, weight],
	);
	const activeSourceHash = activeSource?.sha256;
	const hasCachedCapabilities = activeSourceHash
		? Object.hasOwn(capabilitiesBySource, activeSourceHash)
		: false;
	const activeCapabilities = activeSourceHash
		? (capabilitiesBySource[activeSourceHash] ?? undefined)
		: capabilities;
	const capabilitiesLoading = Boolean(
		activeSourceHash && !hasCachedCapabilities,
	);

	useEffect(() => {
		if (!activeSource || hasCachedCapabilities) return;
		const controller = new AbortController();
		let current = true;
		const capabilitiesUrl = new URL(
			activeSource.capabilitiesUrl,
			'https://api.fontsource.org',
		);

		fetch(capabilitiesUrl, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error('Capabilities unavailable');
				return response.json() as Promise<GetRegistrySourceCapabilitiesResponse>;
			})
			.then((sourceCapabilities) => {
				if (!current) return;
				setCapabilitiesBySource((cached) => ({
					...cached,
					[activeSource.sha256]: sourceCapabilities,
				}));
			})
			.catch(() => {
				if (!current || controller.signal.aborted) return;
				setCapabilitiesBySource((cached) => ({
					...cached,
					[activeSource.sha256]: null,
				}));
			})
			.finally(() => {
				current = false;
			});

		return () => {
			current = false;
			controller.abort();
		};
	}, [activeSource, hasCachedCapabilities]);

	const previewAxes = useMemo(
		() => getPreviewAxes(activeSource, variable, axisRegistry),
		[activeSource, axisRegistry, variable],
	);
	const adjustableAxes = useMemo(
		() =>
			previewAxes.filter((axis) => axis.tag !== 'wght' && axis.tag !== 'ital'),
		[previewAxes],
	);
	const [axisValues, setAxisValues] = useState<Record<string, number>>(() =>
		Object.fromEntries(
			initialSourceAxes
				.filter((axis) => axis.tag !== 'wght' && axis.tag !== 'ital')
				.map((axis) => [axis.tag, axis.default]),
		),
	);

	useEffect(() => {
		setAxisValues((values) =>
			Object.fromEntries(
				adjustableAxes.map((axis) => [
					axis.tag,
					clamp(values[axis.tag] ?? axis.default, axis.min, axis.max),
				]),
			),
		);
	}, [adjustableAxes]);

	const weightAxis = previewAxes.find((axis) => axis.tag === 'wght');
	const weightMin = weightAxis?.min ?? Math.min(...metadata.weights);
	const weightMax = weightAxis?.max ?? Math.max(...metadata.weights);
	const weightStep = weightAxis?.step ?? 1;

	useEffect(() => {
		setWeight((currentWeight) => clamp(currentWeight, weightMin, weightMax));
	}, [weightMax, weightMin]);

	const verifiedLanguages = useMemo(
		() => getVerifiedLanguages(languages, activeCapabilities),
		[languages, activeCapabilities],
	);
	const selectedLanguage = verifiedLanguages.find(
		(language) => language.id === selectedLanguageId,
	);

	useEffect(() => {
		if (
			verifiedLanguages.some((language) => language.id === selectedLanguageId)
		) {
			return;
		}

		setSelectedLanguageId(
			getPreferredLanguage(verifiedLanguages, registry?.primaryLanguage)?.id ??
				'',
		);
	}, [registry?.primaryLanguage, selectedLanguageId, verifiedLanguages]);

	const featureTags = useMemo(
		() => (isSymbolPreviewFamily ? [] : getFeatureTags(activeCapabilities)),
		[activeCapabilities, isSymbolPreviewFamily],
	);
	const [featureValues, setFeatureValues] = useState<Record<string, boolean>>(
		() =>
			Object.fromEntries(
				getFeatureTags(capabilities).map((tag) => [
					tag,
					enabledByDefaultFeatureTags.has(tag),
				]),
			),
	);

	useEffect(() => {
		setFeatureValues((values) => ({
			...values,
			...Object.fromEntries(
				featureTags
					.filter((tag) => values[tag] === undefined)
					.map((tag) => [tag, enabledByDefaultFeatureTags.has(tag)]),
			),
		}));
	}, [featureTags]);

	const filteredAxes = useMemo(() => {
		const query = normalizeSearchValue(axisQuery);
		return query
			? adjustableAxes.filter((axis) =>
					normalizeSearchValue(
						`${axis.name} ${axis.tag} ${axis.description ?? ''}`,
					).includes(query),
				)
			: adjustableAxes;
	}, [adjustableAxes, axisQuery]);
	const filteredFeatures = useMemo(() => {
		const query = normalizeSearchValue(featureQuery);
		return query
			? featureTags.filter((tag) =>
					normalizeSearchValue(
						`${getOpenTypeFeatureName(tag)} ${tag} ${getOpenTypeFeatureDescription(tag)}`,
					).includes(query),
				)
			: featureTags;
	}, [featureQuery, featureTags]);

	const packagePreviewFamily = getFontPreviewFamily(
		metadata,
		Boolean(variable),
	);
	const activePreviewFamily = activeSource
		? `${registrySourcePreviewFamily} ${activeSource.sha256.slice(0, 12)}`
		: packagePreviewFamily;
	const fontFamily = activeSource
		? `${JSON.stringify(activePreviewFamily)}, "Fallback Outline"`
		: getFontFamilyStack(metadata, Boolean(variable), registry);
	const previewDirection = selectedLanguage
		? rtlScripts.has(selectedLanguage.script)
			? 'rtl'
			: 'ltr'
		: getPreviewDirection(previewSubset);
	const lineHeightPixels = size * lineHeight;
	const featureSettings = [
		...featureTags.map((tag) => `"${tag}" ${featureValues[tag] ? 1 : 0}`),
		...(hasNamedLigatures && !featureTags.includes('liga') ? ['"liga" 1'] : []),
	].join(', ');
	const variationSettings = Object.entries(axisValues)
		.map(([axis, value]) => `"${axis}" ${value}`)
		.join(', ');
	const previewStyle = {
		'--preview-size': `${size}px`,
		fontFamily,
		fontWeight: weight,
		fontStyle: italic ? 'italic' : 'normal',
		letterSpacing: `${tracking}px`,
		lineHeight,
		textAlign: alignment,
		fontFeatureSettings: featureSettings || undefined,
		fontVariationSettings: variationSettings || undefined,
	} as React.CSSProperties;
	const activeText = texts[mode];
	const activeModeLabels = isSymbolPreviewFamily
		? symbolModeLabels
		: modeLabels;

	useEffect(() => {
		const saved = saveFontPreviewSelection(metadata.id, {
			format: variable && versions.latestVariable ? 'variable' : 'static',
			subset: previewSubset,
			style: italic ? 'italic' : 'normal',
			weight,
			axes: axisValues,
		});
		setHandoffUnavailable(!saved);
	}, [
		axisValues,
		italic,
		metadata.id,
		previewSubset,
		variable,
		versions.latestVariable,
		weight,
	]);

	const setActiveText = (text: string) => {
		setTexts((currentTexts) => ({ ...currentTexts, [mode]: text }));
	};

	const selectLanguage = (languageId: string) => {
		const language = verifiedLanguages.find((item) => item.id === languageId);
		if (!language?.sampleText) return;
		setSelectedLanguageId(language.id);
		setTexts(createLanguageModeTexts(language));
	};

	const toggleFeature = (tag: string) => {
		setFeatureValues((values) => {
			const enabled = !values[tag];
			const nextValues = { ...values, [tag]: enabled };
			if (enabled) {
				for (const group of exclusiveFeatureGroups) {
					if (!(group as readonly string[]).includes(tag)) continue;
					for (const peer of group) {
						if (peer !== tag) nextValues[peer] = false;
					}
				}
			}
			return nextValues;
		});
	};

	const resetTypography = () => {
		setSize(initialSize);
		setWeight(initialWeight);
		setItalic(false);
		setTracking(0);
		setLineHeight(initialLineHeight);
		setAlignment('start');
	};
	const resetAxes = () => {
		setAxisValues(
			Object.fromEntries(
				adjustableAxes.map((axis) => [axis.tag, axis.default]),
			),
		);
	};
	const resetFeatures = () => {
		setFeatureValues((values) => ({
			...values,
			...Object.fromEntries(
				featureTags.map((tag) => [tag, enabledByDefaultFeatureTags.has(tag)]),
			),
		}));
	};
	const resetAll = () => {
		resetTypography();
		resetAxes();
		resetFeatures();
	};

	const renderInspector = (idPrefix: string, embedded: boolean) => (
		<div className={classes.inspectorContent}>
			{embedded ? (
				<div className={classes.inspectorHeading}>
					<div>
						<h2>Adjust preview</h2>
						<p>Fine-tune this specimen.</p>
					</div>
					<button type="button" onClick={resetAll}>
						<IconRotate aria-hidden height={15} />
						Reset all
					</button>
				</div>
			) : (
				<div className={classes.drawerReset}>
					<button type="button" onClick={resetAll}>
						<IconRotate aria-hidden height={15} />
						Reset all
					</button>
				</div>
			)}

			<section className={classes.inspectorSection}>
				<div className={classes.sectionHeading}>
					<h3>Typography</h3>
					<button type="button" onClick={resetTypography}>
						Reset
					</button>
				</div>
				<RangeControl
					id={`${idPrefix}-size`}
					label="Size"
					value={size}
					min={8}
					max={300}
					step={1}
					formatValue={formatPixels}
					onChange={setSize}
				/>
				<RangeControl
					id={`${idPrefix}-weight`}
					label="Weight"
					value={weight}
					min={weightMin}
					max={weightMax}
					step={weightStep}
					marks={
						weightAxis
							? undefined
							: metadata.weights.map((value) => ({ value }))
					}
					restrictToMarks={!weightAxis && metadata.weights.length > 1}
					disabled={weightMin === weightMax}
					onChange={setWeight}
				/>
				{supportsItalic && (
					<div className={classes.segmentedField}>
						<span>Style</span>
						<SegmentedControl
							fullWidth
							aria-label="Font style"
							value={italic ? 'italic' : 'normal'}
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
							onChange={(value) => setItalic(value === 'italic')}
						/>
					</div>
				)}
				{!isSymbolPreviewFamily && (
					<>
						<RangeControl
							id={`${idPrefix}-tracking`}
							label="Letter spacing"
							value={tracking}
							min={-10}
							max={40}
							step={0.5}
							formatValue={formatPixels}
							onChange={setTracking}
						/>
						<RangeControl
							id={`${idPrefix}-line-height`}
							label="Line height"
							value={Number(lineHeightPixels.toFixed(1))}
							min={Number((size * 0.75).toFixed(1))}
							max={Number((size * 2).toFixed(1))}
							step={0.5}
							formatValue={formatPixels}
							onChange={(value) => setLineHeight(value / size)}
						/>
					</>
				)}
			</section>

			{adjustableAxes.length > 0 && (
				<section className={classes.inspectorSection}>
					<div className={classes.sectionHeading}>
						<div>
							<h3>Variable design</h3>
							<span>
								{adjustableAxes.length}{' '}
								{adjustableAxes.length === 1 ? 'axis' : 'axes'}
							</span>
						</div>
						<button type="button" onClick={resetAxes}>
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
								placeholder={`Search ${adjustableAxes.length} axes`}
								value={axisQuery}
								onChange={(event) => setAxisQuery(event.currentTarget.value)}
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
									setAxisValues((values) => ({
										...values,
										[axis.tag]: value,
									}))
								}
							/>
						))}
						{filteredAxes.length === 0 && (
							<p className={classes.emptyState} role="status">
								No axes match “{axisQuery}”.
							</p>
						)}
					</div>
				</section>
			)}

			{featureTags.length > 0 && (
				<section className={classes.inspectorSection}>
					<div className={classes.sectionHeading}>
						<div>
							<h3>Features</h3>
							<span>Optional OpenType behaviors</span>
						</div>
						<button type="button" onClick={resetFeatures}>
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
								placeholder={`Search ${featureTags.length} features`}
								value={featureQuery}
								onChange={(event) => setFeatureQuery(event.currentTarget.value)}
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
							No features match “{featureQuery}”.
						</p>
					)}
				</section>
			)}

			{capabilitiesLoading && (
				<p className={classes.capabilitiesStatus} role="status">
					Checking the selected style’s available features…
				</p>
			)}
		</div>
	);

	const renderCanvas = () => {
		if (mode === 'waterfall') {
			const sizes = Array.from(
				new Set(
					[1, 0.72, 0.48, 0.3].map((scale) =>
						Math.max(12, Math.round(size * scale)),
					),
				),
			);
			return (
				<div className={classes.derivedCanvas} dir={previewDirection}>
					<label className={classes.derivedEditor}>
						<span>Type your text</span>
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
				<div className={classes.derivedCanvas} dir={previewDirection}>
					<label className={classes.derivedEditor}>
						<span>Type your text</span>
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
						weights={metadata.weights}
						className={classes.compareSkeleton}
					>
						<div className={classes.compareGrid}>
							{metadata.weights.map((value) => (
								<button
									key={value}
									type="button"
									data-active={weight === value || undefined}
									aria-pressed={weight === value}
									onClick={() => setWeight(value)}
								>
									<span>
										{weightNames[value] ?? 'Weight'} {value}
									</span>
									<strong
										style={{
											...previewStyle,
											fontFamily: getFontFamilyStack(
												metadata,
												Boolean(variable),
												registry,
											),
											fontWeight: value,
											fontSize: 'clamp(20px, 2.4vw, 34px)',
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
				<span>Type your text</span>
				<textarea
					className={classes.canvas}
					rows={mode === 'paragraph' ? 6 : 3}
					style={previewStyle}
					dir={previewDirection}
					value={activeText}
					spellCheck={false}
					onChange={(event) => setActiveText(event.currentTarget.value)}
				/>
			</label>
		);
	};

	return (
		<section className={classes.page}>
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{
					__html: [
						variableCSS ?? staticCSS,
						activeSource
							? getRegistrySourcePreviewCSS(activeSource, activePreviewFamily)
							: '',
					]
						.filter(Boolean)
						.join('\n'),
				}}
			/>
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
						Variable controls are temporarily unavailable. Previewing the static
						release instead.
					</p>
				)}

				{symbolPreviewUnavailable && (
					<p className={classes.handoffNotice} role="status">
						Enter a mapped symbol below, or{' '}
						<Link to={`/fonts/${metadata.id}/glyphs`}>
							{hasCatalog
								? 'browse the symbol catalog'
								: 'browse mapped glyphs'}
						</Link>
						.
					</p>
				)}

				{handoffUnavailable && (
					<p className={classes.handoffNotice} role="status">
						Preview choices cannot be remembered in this browser. Get font will
						start from the family defaults.
					</p>
				)}

				<div className={classes.studio}>
					<div className={classes.specimenColumn}>
						<div className={classes.specimenToolbar}>
							{activeModeLabels.length > 1 && (
								<SegmentedControl
									className={classes.modeChooser}
									aria-label="Preview purpose"
									value={mode}
									data={activeModeLabels}
									onChange={(value) => setMode(value as PreviewMode)}
								/>
							)}
							<div className={classes.toolbarActions}>
								{familyKind === 'text' && verifiedLanguages.length > 0 && (
									<DropdownSimple
										label={
											selectedLanguage?.preferredName ??
											selectedLanguage?.name ??
											'Language'
										}
										ariaLabel="Preview language"
										items={verifiedLanguages.map((language) => ({
											label:
												language.autonym && language.autonym !== language.name
													? `${language.preferredName ?? language.name} · ${language.autonym}`
													: (language.preferredName ?? language.name),
											value: language.id,
											isRefined: language.id === selectedLanguageId,
										}))}
										searchable={verifiedLanguages.length > 6}
										refine={selectLanguage}
										w={180}
										dropdownWidth={280}
									/>
								)}
								{!isSymbolPreviewFamily && (
									<fieldset className={classes.alignmentControl}>
										<VisuallyHidden component="legend">
											Text alignment
										</VisuallyHidden>
										{(
											[
												['start', 'Align start', IconAlignLeft],
												['center', 'Align center', IconAlignCenter],
												['end', 'Align end', IconAlignRight],
											] as const
										).map(([value, label, Icon]) => (
											<button
												key={value}
												type="button"
												aria-label={label}
												aria-pressed={alignment === value}
												onClick={() => setAlignment(value)}
											>
												<Icon aria-hidden size={17} stroke={1.8} />
											</button>
										))}
									</fieldset>
								)}
								<button
									type="button"
									className={classes.adjustButton}
									onClick={() => setInspectorOpened(true)}
								>
									<IconAdjustmentsHorizontal
										aria-hidden
										size={18}
										stroke={1.8}
									/>
									Adjust
								</button>
							</div>
						</div>

						<FontSkeleton
							name="font-detail-canvas"
							family={activePreviewFamily}
							weight={weight}
							style={italic ? 'italic' : 'normal'}
							className={classes.canvasSkeleton}
						>
							{renderCanvas()}
						</FontSkeleton>
					</div>

					<aside className={classes.inspector} aria-label="Preview adjustments">
						{renderInspector('desktop-preview', true)}
					</aside>
				</div>
			</div>

			<Drawer
				opened={inspectorOpened}
				onClose={() => setInspectorOpened(false)}
				position="bottom"
				size="min(86dvh, 760px)"
				title="Adjust preview"
				closeButtonProps={{ 'aria-label': 'Close preview adjustments' }}
				classNames={{
					content: classes.drawerContent,
					header: classes.drawerHeader,
					body: classes.drawerBody,
				}}
			>
				{renderInspector('mobile-preview', false)}
			</Drawer>
		</section>
	);
};
