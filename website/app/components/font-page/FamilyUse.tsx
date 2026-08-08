import { Tabs, VisuallyHidden } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { CopyCodeBlock } from '@/components/code/CopyCodeBlock';
import { IconDownload, IconExternal } from '@/components/icons';
import { createProjectItem } from '@/features/projects/createProjectItem';
import {
	getSelectedCssFiles,
	getUsageBlock,
	getUsageMarkup,
	getUsageNote,
} from '@/features/projects/output';
import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetVariableFontResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { deserializeStoredChoice } from '@/utils/browser-storage';
import { getJsDelivrPackageUrl } from '@/utils/cdn';
import {
	getPackageManagerCommand,
	packageManagers,
	packageManagerValues,
} from '@/utils/docs/packageManagers';
import { formatFontLabel, getAxisLabel } from '@/utils/font-labels';
import { getPreferredPreviewSubset } from '@/utils/font-preview';
import { readFontPreviewSelection } from '@/utils/font-preview-selection';
import {
	getRegistryPreviewText,
	type RegistryDataState,
	type RegistryFamily,
} from '@/utils/registry';

import classes from './FamilyUse.module.css';
import { LicenseReceipt } from './LicenseReceipt';

interface FamilyUseProps {
	metadata: GetFontResponse;
	versions: GetFontVersionsResponse;
	variable?: GetVariableFontResponse;
	staticCSS: string;
	variableCSS?: string;
	registry?: RegistryFamily;
	registryState: RegistryDataState;
	languages?: ListRegistryLanguagesResponse;
}

type Method = 'package' | 'cdn';
type AcquisitionPath = 'download' | 'web';
type FamilyFormat = 'variable' | 'static';
type FontStyle = GetFontResponse['styles'][number];

const toggleRequiredValue = <T,>(selected: T[], value: T, available: T[]) => {
	const next = selected.includes(value)
		? selected.length === 1
			? selected
			: selected.filter((item) => item !== value)
		: [...selected, value];
	return available.filter((item) => next.includes(item));
};

const weightNames: Record<number, string> = {
	100: 'Thin',
	200: 'Extra light',
	300: 'Light',
	400: 'Regular',
	500: 'Medium',
	600: 'Semi bold',
	700: 'Bold',
	800: 'Extra bold',
	900: 'Black',
};

const sameValues = <T,>(left: T[], right: T[]) =>
	left.length === right.length && left.every((value) => right.includes(value));

const getWeightLabel = (weight: number) =>
	weightNames[weight] ? `${weight} ${weightNames[weight]}` : String(weight);

export const FamilyUse = ({
	metadata,
	staticCSS,
	variable,
	variableCSS,
	versions,
	registry,
	registryState,
	languages,
}: FamilyUseProps) => {
	const [searchParams] = useSearchParams();
	const supportsVariable = Boolean(variable && versions.latestVariable);
	const supportsStatic = Boolean(versions.latest);
	const preferredSubset = getPreferredPreviewSubset(metadata, registry);
	const recommendedStyle = metadata.styles.includes('normal')
		? 'normal'
		: (metadata.styles[0] ?? 'normal');
	const recommendedWeight = metadata.weights.includes(400)
		? 400
		: (metadata.weights[0] ?? 400);
	const [path, setPath] = useState<AcquisitionPath>('download');
	const [method, setMethod] = useState<Method>('package');
	const [format, setFormat] = useState<FamilyFormat>(
		supportsVariable ? 'variable' : 'static',
	);
	const [selectedStyles, setSelectedStyles] = useState<FontStyle[]>([
		recommendedStyle,
	]);
	const [selectedWeights, setSelectedWeights] = useState<number[]>([
		recommendedWeight,
	]);
	const [customizationOpen, setCustomizationOpen] = useState(false);
	const defaultAxisValues = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(variable?.axes ?? {})
					.filter(([axis]) => axis.toLowerCase() !== 'ital')
					.map(([axis, range]) => [axis, Number(range.default)]),
			),
		[variable],
	);
	const [axisValues, setAxisValues] =
		useState<Record<string, number>>(defaultAxisValues);
	const [previewSettingsApplied, setPreviewSettingsApplied] = useState(false);
	const previewSettingsFamily = useRef<string | null>(null);
	const [packageManager, setPackageManager] = useLocalStorage({
		key: 'package-manager',
		defaultValue: 'npm',
		deserialize: (value) =>
			deserializeStoredChoice(value, packageManagerValues, 'npm'),
	});

	const isVariable = format === 'variable' && supportsVariable;
	const styles = useMemo(
		() => [
			...metadata.styles.filter(
				(style) => style === 'normal' && selectedStyles.includes(style),
			),
			...metadata.styles.filter(
				(style) => style !== 'normal' && selectedStyles.includes(style),
			),
		],
		[metadata.styles, selectedStyles],
	);
	const weights = useMemo(
		() => metadata.weights.filter((weight) => selectedWeights.includes(weight)),
		[metadata.weights, selectedWeights],
	);
	const primaryStyle = styles[0] ?? recommendedStyle;
	const primaryWeight = isVariable
		? (axisValues.wght ?? recommendedWeight)
		: (weights[0] ?? recommendedWeight);
	const defaultFormat: FamilyFormat = supportsVariable ? 'variable' : 'static';
	const axesAreDefault = Object.entries(defaultAxisValues).every(
		([axis, value]) => axisValues[axis] === value,
	);
	const isRecommendedSetup =
		format === defaultFormat &&
		sameValues(styles, [recommendedStyle]) &&
		(isVariable ? axesAreDefault : sameValues(weights, [recommendedWeight]));
	const projectItem = useMemo(
		() =>
			createProjectItem({
				metadata,
				versions,
				variable,
				registry,
				format: isVariable ? 'variable' : 'static',
				subset: preferredSubset,
				style: primaryStyle,
				weight: primaryWeight,
				axes: axisValues,
				sampleText: getRegistryPreviewText(registry, languages),
			}),
		[
			axisValues,
			isVariable,
			languages,
			metadata,
			preferredSubset,
			primaryStyle,
			primaryWeight,
			registry,
			variable,
			versions,
		],
	);
	const { packageName, packageVersion } = projectItem;
	const cssFiles = useMemo(
		() => getSelectedCssFiles(projectItem, styles, weights),
		[projectItem, styles, weights],
	);
	const packageImports = isRecommendedSetup
		? `import '${packageName}';`
		: cssFiles.map((file) => `import '${packageName}/${file}';`).join('\n');
	const cdnLinks = (isRecommendedSetup ? ['index.css'] : cssFiles)
		.map(
			(file) =>
				`<link rel="stylesheet" href="${getJsDelivrPackageUrl(packageName, packageVersion, file)}">`,
		)
		.join('\n');
	const installCommand = getPackageManagerCommand(packageManager, packageName);
	const usageProjectItem = isRecommendedSetup
		? { ...projectItem, axes: {} }
		: projectItem;
	const cssCode = getUsageBlock(usageProjectItem);
	const usageMarkup = getUsageMarkup(projectItem);
	const usageNote = getUsageNote(projectItem);
	const fromSelectedFonts = searchParams.get('from') === 'selected-fonts';
	const canCustomize =
		(supportsStatic && supportsVariable) ||
		metadata.styles.length > 1 ||
		(!isVariable && metadata.weights.length > 1) ||
		(isVariable && Object.keys(variable?.axes ?? {}).length > 0);
	const variableWeightRange = variable?.axes.wght
		? `${Number(variable.axes.wght.min)}–${Number(variable.axes.wght.max)}`
		: `${Math.min(...metadata.weights)}–${Math.max(...metadata.weights)}`;
	const selectionSummary = isVariable
		? `Variable · ${variableWeightRange} weight · ${styles.map(formatFontLabel).join(' + ')}`
		: weights.length === 1 && styles.length === 1
			? `${formatFontLabel(primaryStyle)} · ${getWeightLabel(primaryWeight)}`
			: `${cssFiles.length} faces · ${styles.map(formatFontLabel).join(' + ')}`;
	const exampleFace = `${formatFontLabel(primaryStyle)} ${Math.round(primaryWeight)}`;
	const outputExplanation = isRecommendedSetup
		? isVariable
			? `The default import loads the variable weight range. The CSS example starts at ${exampleFace}.`
			: `The default import loads ${exampleFace}. Choose specific faces only when your project needs them.`
		: isVariable
			? `The import loads the selected variable file. The CSS example uses ${exampleFace} and your chosen axes.`
			: `The imports load ${cssFiles.length} selected ${cssFiles.length === 1 ? 'face' : 'faces'}. The CSS example uses ${exampleFace}.`;
	const hasRegularBoldPreset =
		metadata.styles.includes('normal') &&
		metadata.weights.includes(400) &&
		metadata.weights.includes(700);
	const setStaticPreset = (preset: 'default' | 'regular-bold' | 'all') => {
		if (preset === 'all') {
			setSelectedStyles(metadata.styles);
			setSelectedWeights(metadata.weights);
		} else if (preset === 'regular-bold') {
			setSelectedStyles(['normal']);
			setSelectedWeights([400, 700]);
		} else {
			setSelectedStyles([recommendedStyle]);
			setSelectedWeights([recommendedWeight]);
		}
		setPreviewSettingsApplied(false);
	};

	useEffect(() => {
		if (previewSettingsFamily.current === metadata.id) return;
		previewSettingsFamily.current = metadata.id;
		setFormat(supportsVariable ? 'variable' : 'static');
		setSelectedStyles([recommendedStyle]);
		setSelectedWeights([recommendedWeight]);
		setAxisValues(defaultAxisValues);
		setPreviewSettingsApplied(false);

		const saved = readFontPreviewSelection(metadata.id);
		if (!saved) return;

		setFormat(
			saved.format === 'variable' && supportsVariable
				? 'variable'
				: supportsStatic
					? 'static'
					: 'variable',
		);
		if (metadata.styles.includes(saved.style)) {
			setSelectedStyles([saved.style]);
		}
		if (metadata.weights.includes(saved.weight)) {
			setSelectedWeights([saved.weight]);
		}
		setAxisValues(
			Object.fromEntries(
				Object.entries(variable?.axes ?? {})
					.filter(([axis]) => axis.toLowerCase() !== 'ital')
					.map(([axis, range]) => {
						const value =
							axis === 'wght'
								? saved.weight
								: (saved.axes[axis] ?? Number(range.default));
						return [
							axis,
							Math.min(Number(range.max), Math.max(Number(range.min), value)),
						];
					}),
			),
		);
		setPreviewSettingsApplied(true);
	}, [
		defaultAxisValues,
		metadata,
		recommendedStyle,
		recommendedWeight,
		supportsStatic,
		supportsVariable,
		variable,
	]);

	return (
		<section className={classes.page} aria-labelledby="use-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: variableCSS ?? staticCSS }}
			/>
			<div className={classes.heading}>
				{fromSelectedFonts && (
					<Link className={classes.returnLink} to="/selected-fonts">
						← Back to font set
					</Link>
				)}
				<h2 id="use-heading">Get {metadata.family}</h2>
				<p>Choose where you want to use {metadata.family}.</p>
			</div>
			<Tabs
				className={classes.acquisition}
				value={path}
				onChange={(value) => {
					if (value) setPath(value as AcquisitionPath);
				}}
			>
				<Tabs.List className={classes.taskTabs} grow>
					<Tabs.Tab value="download">
						<span className={classes.taskTabLabel}>
							<strong>Download files</strong>
							<small>For design apps, desktop, and font managers</small>
						</span>
					</Tabs.Tab>
					<Tabs.Tab value="web">
						<span className={classes.taskTabLabel}>
							<strong>Developer setup</strong>
							<small>For packages, frameworks, and CDN</small>
						</span>
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel className={classes.taskPanel} value="download">
					<div className={classes.downloadPanel}>
						<div className={classes.downloadDetails}>
							<h3>Complete family (.zip)</h3>
							<p>TTF, WOFF, WOFF2, CSS, and the original license.</p>
						</div>
						<div className={classes.downloadAction}>
							<a
								className={classes.primaryButton}
								href={`/fonts/${metadata.id}/download`}
								target="_blank"
								rel="noreferrer"
							>
								<IconDownload aria-hidden height={18} stroke="currentColor" />
								Download complete family (.zip)
							</a>
							<LicenseReceipt
								familyId={metadata.id}
								license={registry?.license}
								registryState={registryState}
							/>
						</div>
					</div>
				</Tabs.Panel>

				<Tabs.Panel className={classes.taskPanel} value="web">
					<div className={classes.webPanel}>
						<fieldset className={classes.methodSwitch}>
							<VisuallyHidden component="legend">
								Choose how to add this font to a website
							</VisuallyHidden>
							<button
								type="button"
								data-active={method === 'package' || undefined}
								aria-pressed={method === 'package'}
								onClick={() => setMethod('package')}
							>
								Package
							</button>
							<button
								type="button"
								data-active={method === 'cdn' || undefined}
								aria-pressed={method === 'cdn'}
								onClick={() => setMethod('cdn')}
							>
								Quick embed
							</button>
						</fieldset>

						{method === 'cdn' && (
							<p className={classes.deliveryNote}>
								Loads a versioned stylesheet from jsDelivr. Package is
								recommended when you can bundle and self-host the font.
							</p>
						)}

						<div className={classes.setupSummary}>
							<div>
								<strong>
									{isRecommendedSetup ? 'Recommended setup' : 'Current setup'}
								</strong>
								<span>{selectionSummary}</span>
							</div>
							{canCustomize && (
								<button
									type="button"
									className={classes.customizeButton}
									aria-expanded={customizationOpen}
									aria-controls="web-font-options"
									onClick={() => setCustomizationOpen((open) => !open)}
								>
									{customizationOpen ? 'Done customizing' : 'Customize setup'}
								</button>
							)}
						</div>

						{previewSettingsApplied && !customizationOpen && (
							<p className={classes.previewHandoff}>
								Using your latest choices from Preview.
							</p>
						)}

						{customizationOpen && (
							<div className={classes.customization} id="web-font-options">
								<div className={classes.customizationHeading}>
									<strong>Choose only what your project uses</strong>
									<span>The code below updates automatically.</span>
								</div>

								{supportsStatic && supportsVariable && (
									<fieldset className={classes.formatSwitch}>
										<legend>Font format</legend>
										<div>
											<button
												type="button"
												data-active={isVariable || undefined}
												aria-pressed={isVariable}
												onClick={() => {
													setFormat('variable');
													setPreviewSettingsApplied(false);
												}}
											>
												Variable
											</button>
											<button
												type="button"
												data-active={!isVariable || undefined}
												aria-pressed={!isVariable}
												onClick={() => {
													setFormat('static');
													setPreviewSettingsApplied(false);
												}}
											>
												Static
											</button>
										</div>
									</fieldset>
								)}

								{!isVariable && metadata.weights.length > 1 && (
									<fieldset className={classes.presetGroup}>
										<legend>Quick selections</legend>
										<div>
											<button
												type="button"
												aria-pressed={
													sameValues(styles, [recommendedStyle]) &&
													sameValues(weights, [recommendedWeight])
												}
												onClick={() => setStaticPreset('default')}
											>
												Default
											</button>
											{hasRegularBoldPreset && (
												<button
													type="button"
													aria-pressed={
														sameValues(styles, ['normal']) &&
														sameValues(weights, [400, 700])
													}
													onClick={() => setStaticPreset('regular-bold')}
												>
													Regular + Bold
												</button>
											)}
											<button
												type="button"
												aria-pressed={
													sameValues(styles, metadata.styles) &&
													sameValues(weights, metadata.weights)
												}
												onClick={() => setStaticPreset('all')}
											>
												All faces
											</button>
										</div>
									</fieldset>
								)}

								{metadata.styles.length > 1 && (
									<fieldset className={classes.optionGroup}>
										<legend>Styles</legend>
										<div>
											{metadata.styles.map((style) => {
												const selected = styles.includes(style);
												return (
													<label key={style}>
														<input
															type="checkbox"
															checked={selected}
															disabled={selected && styles.length === 1}
															onChange={() => {
																setSelectedStyles((current) =>
																	toggleRequiredValue(
																		current,
																		style,
																		metadata.styles,
																	),
																);
																setPreviewSettingsApplied(false);
															}}
														/>
														<span>{formatFontLabel(style)}</span>
													</label>
												);
											})}
										</div>
									</fieldset>
								)}

								{!isVariable && metadata.weights.length > 1 && (
									<fieldset className={classes.optionGroup}>
										<legend>Weights</legend>
										<div>
											{metadata.weights.map((weight) => {
												const selected = weights.includes(weight);
												return (
													<label key={weight}>
														<input
															type="checkbox"
															checked={selected}
															disabled={selected && weights.length === 1}
															onChange={() => {
																setSelectedWeights((current) =>
																	toggleRequiredValue(
																		current,
																		weight,
																		metadata.weights,
																	),
																);
																setPreviewSettingsApplied(false);
															}}
														/>
														<span>{getWeightLabel(weight)}</span>
													</label>
												);
											})}
										</div>
									</fieldset>
								)}

								{isVariable &&
									Object.entries(variable?.axes ?? {})
										.filter(([axis]) => axis.toLowerCase() !== 'ital')
										.map(([axis, range]) => {
											const value = axisValues[axis] ?? Number(range.default);
											return (
												<label className={classes.axisControl} key={axis}>
													<span>
														{getAxisLabel(axis)}
														<output>{value}</output>
													</span>
													<input
														type="range"
														min={Number(range.min)}
														max={Number(range.max)}
														step={Number(range.step)}
														value={value}
														onChange={(event) => {
															setAxisValues((values) => ({
																...values,
																[axis]: Number(event.currentTarget.value),
															}));
															setPreviewSettingsApplied(false);
														}}
													/>
												</label>
											);
										})}
							</div>
						)}

						{method === 'package' && (
							<fieldset className={classes.manager}>
								<legend>Install with</legend>
								<div>
									{packageManagers.map((manager) => (
										<button
											key={manager.value}
											type="button"
											data-active={
												packageManager === manager.value || undefined
											}
											aria-pressed={packageManager === manager.value}
											onClick={() => setPackageManager(manager.value)}
										>
											{manager.value}
										</button>
									))}
								</div>
							</fieldset>
						)}

						<div className={classes.instructions}>
							{method === 'package' && (
								<CopyCodeBlock
									code={installCommand}
									label="Install"
									language="sh"
								/>
							)}
							<CopyCodeBlock
								code={method === 'package' ? packageImports : cdnLinks}
								label={
									method === 'package' ? 'Import files' : 'HTML stylesheet'
								}
								language={method === 'package' ? 'js' : 'html'}
							/>
							<CopyCodeBlock
								code={cssCode}
								label={`Example CSS · ${exampleFace}`}
								language="css"
							/>
							{usageMarkup && (
								<CopyCodeBlock
									code={usageMarkup}
									label="HTML example"
									language="html"
								/>
							)}
						</div>
						<p className={classes.outputExplanation}>{outputExplanation}</p>

						{usageNote && <p className={classes.usageHelp}>{usageNote}</p>}
						<Link
							className={classes.guideLink}
							to="/docs/getting-started/install"
						>
							New to web fonts? Read the guide
							<IconExternal aria-hidden height={15} stroke="currentColor" />
						</Link>
					</div>
				</Tabs.Panel>
			</Tabs>
		</section>
	);
};
