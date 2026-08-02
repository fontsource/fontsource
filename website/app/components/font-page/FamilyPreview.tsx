import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { DropdownSimple } from '@/components/Dropdown';
import {
	FamilyActions,
	FamilyIdentity,
	FamilyTabs,
} from '@/components/font-page/FamilyPageShell';
import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetVariableFontResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { getAxisLabel } from '@/utils/font-labels';
import {
	getFontFamilyStack,
	getFontPreviewFamily,
	getPreferredPreviewSubset,
	getPreviewDirection,
	isLatinPreviewSubset,
} from '@/utils/font-preview';
import { saveFontPreviewSelection } from '@/utils/font-preview-selection';
import { getPreviewText as getLanguagePreviewText } from '@/utils/language/language';
import {
	getRegistryFamilyKind,
	getRegistryPreviewText,
	type RegistryDataState,
	type RegistryFamily,
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
	variableUnavailable?: boolean;
}

const previewModes = {
	headline: 'Make something\nmemorable.',
	paragraph:
		'Good typography makes a page easier to enter, understand, and remember.',
	numbers: '0123456789  24:00  €99.95',
	code: 'const type = "beautiful";',
	symbols: '& @ # % ? ! → ← × ÷',
} as const;

type PreviewMode = keyof typeof previewModes;

const modeLabels: Array<{ label: string; value: PreviewMode }> = [
	{ label: 'Headlines', value: 'headline' },
	{ label: 'Paragraphs', value: 'paragraph' },
	{ label: 'Numbers', value: 'numbers' },
	{ label: 'Code', value: 'code' },
	{ label: 'Symbols', value: 'symbols' },
];

const scriptModeLabels = modeLabels.filter((item) => item.value !== 'code');

const symbolCatalogModeLabels: typeof modeLabels = [
	{ label: 'Symbols', value: 'headline' },
];

const getModeText = (
	metadata: GetFontResponse,
	mode: PreviewMode,
	registry?: RegistryFamily,
	languages?: ListRegistryLanguagesResponse,
) => {
	const previewSubset = getPreferredPreviewSubset(metadata, registry);
	const familyKind = getRegistryFamilyKind(registry);
	const registrySample =
		registry?.sampleText ||
		(registry?.primaryScript && registry.primaryScript !== 'Latn')
			? getRegistryPreviewText(
					registry,
					languages,
					mode === 'paragraph' ? 'long' : 'short',
				)
			: undefined;

	if (
		registrySample &&
		(mode === 'headline' || mode === 'paragraph' || familyKind === 'symbols')
	) {
		return registrySample;
	}

	if (familyKind === 'symbols') return '';

	if (familyKind === 'digital') {
		const digitalPreviews: Record<PreviewMode, string> = {
			headline: '12:48:36',
			paragraph: 'TEMPERATURE 24.5',
			numbers: '0123456789',
			code: '88:88  00.00',
			symbols: '+ − × ÷ : .',
		};
		return digitalPreviews[mode];
	}

	if (familyKind === 'punctuation') {
		return mode === 'numbers'
			? '0123456789'
			: '「ことば」を、心地よく。\n句読点まで、美しく。';
	}

	if (!isLatinPreviewSubset(previewSubset)) {
		if (mode === 'headline' || mode === 'paragraph') {
			return getLanguagePreviewText(previewSubset);
		}
	}

	return previewModes[mode];
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

const nearestWeight = (weights: number[], target: number) =>
	weights.reduce((closest, weight) =>
		Math.abs(weight - target) < Math.abs(closest - target) ? weight : closest,
	);

const formatPixels = (value: number) =>
	`${Number.isInteger(value) ? value : value.toFixed(1)} px`;

const previewSizes = [64, 80, 104, 128];

export const FamilyPreview = ({
	metadata,
	staticCSS,
	variable,
	variableCSS,
	versions,
	registry,
	registryState,
	languages,
	variableUnavailable = false,
}: FamilyPreviewProps) => {
	const previewSubset = getPreferredPreviewSubset(metadata, registry);
	const usesLatinPreview = registry?.primaryScript
		? registry.primaryScript === 'Latn'
		: isLatinPreviewSubset(previewSubset);
	const hasCatalog = Boolean(registry?.symbols);
	const hasNamedLigatures = usesNameLigatures(registry);
	const familyKind = getRegistryFamilyKind(registry);
	const isDigitalFamily = familyKind === 'digital';
	const isSymbolPreviewFamily = familyKind === 'symbols';
	const registrySample = registry?.sampleText?.short.trim();
	const symbolPreviewUnavailable = isSymbolPreviewFamily && !registrySample;
	const initialWeight = nearestWeight(metadata.weights, 600);
	const initialMode: PreviewMode = isSymbolPreviewFamily
		? 'headline'
		: isDigitalFamily
			? 'numbers'
			: metadata.category === 'monospace'
				? 'code'
				: 'headline';
	const [mode, setMode] = useState<PreviewMode>(initialMode);
	const [text, setText] = useState<string>(
		getModeText(metadata, initialMode, registry, languages),
	);
	const [size, setSize] = useState(
		metadata.category === 'monospace' || hasCatalog
			? 80
			: usesLatinPreview
				? 104
				: 80,
	);
	const [weight, setWeight] = useState(initialWeight);
	const [italic, setItalic] = useState(false);
	const [tracking, setTracking] = useState(0);
	const [lineHeight, setLineHeight] = useState(usesLatinPreview ? 0.95 : 1.2);
	const [handoffUnavailable, setHandoffUnavailable] = useState(false);
	const adjustableAxes = useMemo(
		() =>
			Object.entries(variable?.axes ?? {}).filter(
				([axis]) => axis !== 'wght' && axis !== 'ital',
			),
		[variable],
	);
	const [axisValues, setAxisValues] = useState<Record<string, number>>(() =>
		Object.fromEntries(
			adjustableAxes.map(([axis, range]) => [axis, Number(range.default)]),
		),
	);
	const fontFamily = getFontFamilyStack(metadata, Boolean(variable), registry);
	const previewFamily = getFontPreviewFamily(metadata, Boolean(variable));
	const lineHeightPixels = size * lineHeight;
	const supportsItalic = metadata.styles.includes('italic');
	const activeModeLabels = isSymbolPreviewFamily
		? symbolCatalogModeLabels
		: usesLatinPreview
			? modeLabels
			: scriptModeLabels;
	const weightSpecimen =
		(registry?.sampleText || !usesLatinPreview
			? getRegistryPreviewText(registry, languages)
			: undefined) ?? metadata.family;
	const previewStyle = {
		'--preview-size': `${size}px`,
		fontFamily,
		fontWeight: weight,
		fontStyle: italic ? 'italic' : 'normal',
		letterSpacing: `${tracking}px`,
		lineHeight,
		fontFeatureSettings: hasNamedLigatures ? '"liga"' : undefined,
		fontVariationSettings:
			adjustableAxes.length > 0
				? Object.entries(axisValues)
						.map(([axis, value]) => `"${axis}" ${value}`)
						.join(', ')
				: undefined,
	} as React.CSSProperties;
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

	const selectMode = (nextMode: PreviewMode) => {
		setMode(nextMode);
		setText(getModeText(metadata, nextMode, registry, languages));
	};

	return (
		<section className={classes.page}>
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: variableCSS ?? staticCSS }}
			/>
			<div className={classes.workbench}>
				<div className={classes.identityPanel}>
					<div>
						<FamilyIdentity
							metadata={metadata}
							registry={registry}
							variableAvailable={Boolean(variable)}
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

				<div className={classes.workspace}>
					<div className={classes.workspaceHeader}>
						{activeModeLabels.length > 1 && (
							<fieldset className={classes.purposeChooser}>
								<legend>Try it as</legend>
								<div>
									{activeModeLabels.map((item) => (
										<label key={item.value}>
											<input
												type="radio"
												name={`preview-purpose-${metadata.id}`}
												value={item.value}
												checked={mode === item.value}
												onChange={() => selectMode(item.value)}
											/>
											<span>{item.label}</span>
										</label>
									))}
								</div>
							</fieldset>
						)}
						<div className={classes.controls}>
							<div className={classes.control}>
								<span className={classes.controlLabel}>Size</span>
								<DropdownSimple
									label={`${size} px`}
									ariaLabel={`Size: ${size} pixels`}
									items={previewSizes.map((value) => ({
										label: `${value} px`,
										value: String(value),
										isRefined: size === value,
									}))}
									refine={(value) => setSize(Number(value))}
									w={104}
								/>
							</div>
							<div className={classes.control}>
								<span className={classes.controlLabel}>Weight</span>
								<DropdownSimple
									label={String(weight)}
									ariaLabel={`Weight: ${weightNames[weight] ?? weight}, ${weight}`}
									items={metadata.weights.map((value) => ({
										label: `${weightNames[value] ?? 'Weight'} ${value}`,
										value: String(value),
										isRefined: weight === value,
									}))}
									refine={(value) => setWeight(Number(value))}
									w={132}
									dropdownWidth={180}
								/>
							</div>
							{supportsItalic && (
								<button
									type="button"
									className={classes.italicToggle}
									aria-pressed={italic}
									onClick={() => setItalic((active) => !active)}
								>
									<span className={classes.italicMark} aria-hidden="true">
										I
									</span>
									Italic
								</button>
							)}
						</div>
					</div>

					{variableUnavailable && (
						<p className={classes.handoffNotice} role="status">
							Variable controls are temporarily unavailable. Previewing the
							static release instead.
						</p>
					)}

					{symbolPreviewUnavailable && (
						<p className={classes.handoffNotice} role="status">
							No preview sample is available yet. Enter a mapped symbol below,
							or{' '}
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
							This browser cannot remember Preview choices. Get font still
							works, but its setup will start from the family defaults.
						</p>
					)}

					<FontSkeleton
						name="font-detail-canvas"
						family={previewFamily}
						weight={weight}
						style={italic ? 'italic' : 'normal'}
					>
						<label className={classes.canvasField}>
							<span>Type your text</span>
							<textarea
								className={classes.canvas}
								rows={3}
								style={previewStyle}
								dir={getPreviewDirection(previewSubset)}
								value={text}
								onChange={(event) => setText(event.currentTarget.value)}
								spellCheck={false}
							/>
						</label>
					</FontSkeleton>

					<div className={classes.customizePanel}>
						<label className={classes.rangeControl}>
							<span className={classes.rangeLabel}>
								Letter spacing
								<output>{formatPixels(tracking)}</output>
							</span>
							<input
								type="range"
								min={-5}
								max={20}
								value={tracking}
								aria-valuetext={formatPixels(tracking)}
								onChange={(event) => setTracking(Number(event.target.value))}
							/>
						</label>
						<label className={classes.rangeControl}>
							<span className={classes.rangeLabel}>
								Line height
								<output>{formatPixels(lineHeightPixels)}</output>
							</span>
							<input
								type="range"
								min={0.8}
								max={1.8}
								step={0.01}
								value={lineHeight}
								aria-valuetext={formatPixels(lineHeightPixels)}
								onChange={(event) => setLineHeight(Number(event.target.value))}
							/>
						</label>
						{adjustableAxes.length > 0 && (
							<section
								className={classes.variableControls}
								aria-labelledby="variable-axes-title"
							>
								<div className={classes.variableHeader}>
									<h3 id="variable-axes-title">Variable axes</h3>
									<span>
										{adjustableAxes.length}{' '}
										{adjustableAxes.length === 1 ? 'axis' : 'axes'}
									</span>
								</div>
								<div className={classes.axisGrid}>
									{adjustableAxes.map(([axis, range]) => (
										<label className={classes.rangeControl} key={axis}>
											<span className={classes.rangeLabel}>
												<span className={classes.axisName}>
													{getAxisLabel(axis)} <code>{axis}</code>
												</span>
												<output>{axisValues[axis]}</output>
											</span>
											<input
												type="range"
												aria-label={`${getAxisLabel(axis)} axis`}
												min={Number(range.min)}
												max={Number(range.max)}
												step={Number(range.step)}
												value={axisValues[axis]}
												onChange={(event) =>
													setAxisValues((values) => ({
														...values,
														[axis]: Number(event.currentTarget.value),
													}))
												}
											/>
										</label>
									))}
								</div>
							</section>
						)}
					</div>

					{!symbolPreviewUnavailable && (
						<div className={classes.styleRail}>
							<div>
								<h3>Compare weights</h3>
								<span>{metadata.weights.length} available</span>
							</div>
							<FontSkeleton
								name="font-detail-weight-strip"
								family={previewFamily}
								weights={metadata.weights}
								className={classes.weightSkeleton}
							>
								<fieldset
									className={classes.weightStrip}
									aria-label="Weight comparison"
									style={
										{
											'--weight-count': metadata.weights.length,
										} as React.CSSProperties
									}
								>
									{metadata.weights.map((value) => (
										<button
											key={value}
											type="button"
											className={classes.weightSample}
											data-active={weight === value || undefined}
											aria-pressed={weight === value}
											onClick={() => setWeight(value)}
										>
											<span>
												{weightNames[value] ?? 'Weight'} {value}
											</span>
											<strong
												style={{
													fontFamily,
													fontFeatureSettings: hasNamedLigatures
														? '"liga"'
														: undefined,
													fontVariationSettings:
														previewStyle.fontVariationSettings,
													fontWeight: value,
												}}
											>
												{weightSpecimen}
											</strong>
										</button>
									))}
								</fieldset>
							</FontSkeleton>
						</div>
					)}
				</div>
			</div>
		</section>
	);
};
