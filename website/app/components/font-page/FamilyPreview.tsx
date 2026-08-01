import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import {
	FamilyActions,
	FamilyIdentity,
	FamilyTabs,
} from '@/components/preview/Tabs';
import { createProjectItem } from '@/features/projects/createProjectItem';
import { ProjectAddButton } from '@/features/projects/ProjectAddButton';
import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetVariableFontResponse,
} from '@/generated/api';
import {
	getFontFamilyStack,
	getPreferredPreviewSubset,
	getPreviewDirection,
	isLatinPreviewSubset,
} from '@/utils/font-preview';
import { saveFontPreviewSelection } from '@/utils/font-preview-selection';
import { getPreviewText as getLanguagePreviewText } from '@/utils/language/language';
import {
	hasSymbolCatalog,
	isDigitalFontFamily,
	isPunctuationFontFamily,
	isSymbolFontFamily,
	type RegistryFamily,
	usesNameLigatures,
} from '@/utils/registry';

import classes from './FamilyPreview.module.css';

interface FamilyPreviewProps {
	metadata: GetFontResponse;
	staticCSS: string;
	variable?: GetVariableFontResponse;
	variableCSS?: string;
	versions: GetFontVersionsResponse;
	registry?: RegistryFamily;
	registryUnavailable?: boolean;
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
	{ label: 'Text', value: 'headline' },
	{ label: 'Paragraph', value: 'paragraph' },
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
) => {
	const previewSubset = getPreferredPreviewSubset(metadata);
	const isDigitalFamily = isDigitalFontFamily(registry);
	const isPunctuationFamily = isPunctuationFontFamily(registry);
	const isSymbolPreviewFamily =
		(hasSymbolCatalog(registry) || isSymbolFontFamily(registry)) &&
		!isDigitalFamily &&
		!isPunctuationFamily;
	const registrySample =
		registry?.sampleText?.tester?.trim() ??
		registry?.sampleText?.styles?.trim();

	if (
		registrySample &&
		(mode === 'headline' || mode === 'paragraph' || isSymbolPreviewFamily)
	) {
		return registrySample;
	}

	if (isSymbolPreviewFamily) return '';

	if (isDigitalFamily) {
		const digitalPreviews: Record<PreviewMode, string> = {
			headline: '12:48:36',
			paragraph: 'TEMPERATURE 24.5',
			numbers: '0123456789',
			code: '88:88  00.00',
			symbols: '+ − × ÷ : .',
		};
		return digitalPreviews[mode];
	}

	if (isPunctuationFamily) {
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

const axisNames: Record<string, string> = {
	FILL: 'Fill',
	GRAD: 'Grade',
	SOFT: 'Softness',
	WONK: 'Wonky',
	opsz: 'Optical size',
	slnt: 'Slant',
	wdth: 'Width',
};

const getWeightSpecimen = (
	metadata: GetFontResponse,
	registry?: RegistryFamily,
) => {
	return (
		registry?.sampleText?.styles ??
		registry?.sampleText?.tester ??
		metadata.family
	);
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

const comparisonWeights = (weights: number[]) =>
	Array.from(
		new Set([
			weights[0],
			nearestWeight(weights, 400),
			nearestWeight(weights, 600),
			weights.at(-1) ?? weights[0],
		]),
	);

export const FamilyPreview = ({
	metadata,
	staticCSS,
	variable,
	variableCSS,
	versions,
	registry,
	registryUnavailable = false,
	variableUnavailable = false,
}: FamilyPreviewProps) => {
	const previewSubset = getPreferredPreviewSubset(metadata);
	const usesLatinPreview = isLatinPreviewSubset(previewSubset);
	const hasCatalog = hasSymbolCatalog(registry);
	const hasNamedLigatures = usesNameLigatures(registry);
	const isDigitalFamily = isDigitalFontFamily(registry);
	const isPunctuationFamily = isPunctuationFontFamily(registry);
	const isSymbolPreviewFamily =
		(hasCatalog || isSymbolFontFamily(registry)) &&
		!isDigitalFamily &&
		!isPunctuationFamily;
	const registrySample =
		registry?.sampleText?.tester?.trim() ??
		registry?.sampleText?.styles?.trim();
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
		getModeText(metadata, initialMode, registry),
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
	const [customizeOpen, setCustomizeOpen] = useState(false);
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
	const weights = useMemo(
		() => comparisonWeights(metadata.weights),
		[metadata.weights],
	);
	const fontFamily = getFontFamilyStack(metadata, Boolean(variable), registry);
	const activeModeLabels = isSymbolPreviewFamily
		? symbolCatalogModeLabels
		: usesLatinPreview
			? modeLabels
			: scriptModeLabels;
	const weightSpecimen = getWeightSpecimen(metadata, registry);
	const previewStyle = {
		'--preview-size': `${size}px`,
		fontFamily,
		fontWeight: weight,
		fontStyle: italic ? 'italic' : 'normal',
		letterSpacing: `${tracking / 100}em`,
		lineHeight,
		fontFeatureSettings: hasNamedLigatures ? '"liga"' : undefined,
		fontVariationSettings:
			adjustableAxes.length > 0
				? Object.entries(axisValues)
						.map(([axis, value]) => `"${axis}" ${value}`)
						.join(', ')
				: undefined,
	} as React.CSSProperties;
	const projectItem = useMemo(
		() =>
			createProjectItem({
				metadata,
				versions,
				variable,
				registry,
				format: variable && versions.latestVariable ? 'variable' : 'static',
				subset: previewSubset,
				style: italic ? 'italic' : 'normal',
				weight,
				axes: axisValues,
				sampleText: text,
			}),
		[
			axisValues,
			italic,
			metadata,
			previewSubset,
			registry,
			text,
			variable,
			versions,
			weight,
		],
	);

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
		setText(getModeText(metadata, nextMode, registry));
	};

	return (
		<section className={classes.page} aria-labelledby="preview-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: variableCSS ?? staticCSS }}
			/>
			<h2 className={classes.visuallyHidden} id="preview-heading">
				Preview {metadata.family}
			</h2>

			<div className={classes.workbench}>
				<div className={classes.identityPanel}>
					<div>
						<FamilyIdentity
							metadata={metadata}
							registry={registry}
							fontFamily={fontFamily}
						/>
						<Link
							className={classes.licenseSignal}
							to={`/fonts/${metadata.id}/about#license`}
						>
							{registry?.license
								? `${registry.license.id} license · verified registry record`
								: registryUnavailable
									? 'License verification temporarily unavailable'
									: 'License record not verified'}
						</Link>
					</div>
					<FamilyActions
						metadata={metadata}
						compact
						secondaryAction={<ProjectAddButton item={projectItem} />}
					/>
				</div>

				<FamilyTabs activeTab="preview" metadata={metadata} contained />

				<div className={classes.workspace}>
					<div className={classes.workspaceHeader}>
						<div className={classes.controls}>
							{activeModeLabels.length > 1 && (
								<label className={classes.control}>
									<span className={classes.controlLabel}>Preset</span>
									<select
										value={mode}
										onChange={(event) =>
											selectMode(event.target.value as PreviewMode)
										}
									>
										{activeModeLabels.map((item) => (
											<option key={item.value} value={item.value}>
												{item.label}
											</option>
										))}
									</select>
								</label>
							)}
							<div className={classes.quickAdjust}>
								<label className={classes.control}>
									<span className={classes.controlLabel}>Size</span>
									<select
										value={size}
										onChange={(event) => setSize(Number(event.target.value))}
									>
										{[64, 80, 104, 128].map((value) => (
											<option key={value} value={value}>
												{value} px
											</option>
										))}
									</select>
								</label>
								<label className={classes.control}>
									<span className={classes.controlLabel}>Weight</span>
									<select
										value={weight}
										onChange={(event) => setWeight(Number(event.target.value))}
									>
										{metadata.weights.map((value) => (
											<option key={value} value={value}>
												{value}
											</option>
										))}
									</select>
								</label>
							</div>
							<button
								type="button"
								className={classes.customizeButton}
								aria-expanded={customizeOpen}
								aria-controls="preview-customize"
								onClick={() => setCustomizeOpen((open) => !open)}
							>
								{customizeOpen ? 'Hide adjustments' : 'Adjust'}
							</button>
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
							The registry does not provide a reviewed Preview sample yet. Enter
							a mapped symbol below, or{' '}
							<Link to={`/fonts/${metadata.id}/glyphs`}>
								{hasCatalog
									? 'browse the verified catalog'
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

					{customizeOpen && (
						<div className={classes.customizePanel} id="preview-customize">
							<div className={classes.mobileAdjust}>
								<label className={classes.control}>
									<span className={classes.controlLabel}>Size</span>
									<select
										value={size}
										onChange={(event) => setSize(Number(event.target.value))}
									>
										{[64, 80, 104, 128].map((value) => (
											<option key={value} value={value}>
												{value} px
											</option>
										))}
									</select>
								</label>
								<label className={classes.control}>
									<span className={classes.controlLabel}>Weight</span>
									<select
										value={weight}
										onChange={(event) => setWeight(Number(event.target.value))}
									>
										{metadata.weights.map((value) => (
											<option key={value} value={value}>
												{value}
											</option>
										))}
									</select>
								</label>
							</div>
							<label>
								<span>Letter spacing</span>
								<input
									type="range"
									min={-5}
									max={20}
									value={tracking}
									onChange={(event) => setTracking(Number(event.target.value))}
								/>
							</label>
							<label>
								<span>Line height</span>
								<input
									type="range"
									min={0.8}
									max={1.8}
									step={0.05}
									value={lineHeight}
									onChange={(event) =>
										setLineHeight(Number(event.target.value))
									}
								/>
							</label>
							<label className={classes.checkLabel}>
								<input
									type="checkbox"
									checked={italic}
									disabled={!metadata.styles.includes('italic')}
									onChange={(event) => setItalic(event.currentTarget.checked)}
								/>
								<span>Italic</span>
							</label>
							{adjustableAxes.map(([axis, range]) => (
								<label className={classes.axisControl} key={axis}>
									<span>
										{axisNames[axis] ?? axis.toUpperCase()}
										<output>{axisValues[axis]}</output>
									</span>
									<input
										type="range"
										aria-label={`${axisNames[axis] ?? axis} axis`}
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
					)}

					{!symbolPreviewUnavailable && (
						<div className={classes.styleRail}>
							<div>
								<h3>Compare weights</h3>
								<span>{metadata.weights.length} available</span>
							</div>
							<fieldset
								className={classes.weightStrip}
								aria-label="Weight comparison"
							>
								{weights.map((value) => (
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
						</div>
					)}
				</div>
			</div>
		</section>
	);
};
