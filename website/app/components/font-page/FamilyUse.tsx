import { Tabs, VisuallyHidden } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { CopyCodeBlock } from '@/components/code/CopyCodeBlock';
import { IconDownload, IconExternal } from '@/components/icons';
import { createProjectItem } from '@/features/projects/createProjectItem';
import {
	getUsageBlock,
	getUsageMarkup,
	getUsageNote,
} from '@/features/projects/output';
import { ProjectAddButton } from '@/features/projects/ProjectAddButton';
import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetVariableFontResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { deserializeStoredChoice } from '@/utils/browser-storage';
import {
	getPackageManagerCommand,
	packageManagers,
	packageManagerValues,
} from '@/utils/docs/packageManagers';
import { formatFontLabel, getAxisLabel } from '@/utils/font-labels';
import { getPreferredPreviewSubset } from '@/utils/font-preview';
import {
	getRegistryPreviewText,
	type RegistryDataState,
	type RegistryFamily,
} from '@/utils/registry';

import classes from './FamilyUse.module.css';
import {
	buildFamilyUseCSS,
	type FontDisplay,
	fontDisplays,
	type WebFontFormat,
	webFontFormats,
} from './family-use-css';
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
	const fromSelectedFonts = searchParams.get('from') === 'selected-fonts';
	const supportsVariable = Boolean(variable && versions.latestVariable);
	const supportsStatic = Boolean(versions.latest);
	const preferredSubset = getPreferredPreviewSubset(metadata, registry);
	const recommendedStyle = metadata.styles.includes('normal')
		? 'normal'
		: (metadata.styles[0] ?? 'normal');
	const recommendedWeight = metadata.weights.includes(400)
		? 400
		: (metadata.weights[0] ?? 400);
	const defaultAxisValues = Object.fromEntries(
		Object.entries(variable?.axes ?? {})
			.filter(([axis]) => axis.toLowerCase() !== 'ital')
			.map(([axis, range]) => [axis, Number(range.default)]),
	);
	const availableAxes = Object.keys(variable?.axes ?? {}).filter(
		(axis) => axis.toLowerCase() !== 'ital',
	);
	const defaultActiveAxes = availableAxes.includes('wght')
		? ['wght']
		: availableAxes.slice(0, 1);
	const requestedStyles = searchParams
		.get('styles')
		?.split(',')
		.filter((style): style is FontStyle =>
			metadata.styles.includes(style as FontStyle),
		);
	const requestedWeights = searchParams
		.get('weights')
		?.split(',')
		.map(Number)
		.filter((weight) => metadata.weights.includes(weight));
	const requestedSubsets = searchParams
		.get('subsets')
		?.split(',')
		.filter((subset) => metadata.subsets.includes(subset));
	const requestedActiveAxes = searchParams
		.get('activeAxes')
		?.split(',')
		.filter((axis) => availableAxes.includes(axis));
	const requestedDisplay = fontDisplays.find(
		(display) => display === searchParams.get('display'),
	);
	const requestedFormats = searchParams
		.get('formats')
		?.split(',')
		.filter((format): format is WebFontFormat =>
			webFontFormats.includes(format as WebFontFormat),
		);
	const requestedAxes = Object.fromEntries(
		(searchParams.get('axes')?.split(',') ?? []).flatMap((entry) => {
			const [axis, rawValue] = entry.split(':');
			const range = variable?.axes[axis];
			const value = Number(rawValue);
			if (!range || !Number.isFinite(value) || axis.toLowerCase() === 'ital') {
				return [];
			}
			return [
				[axis, Math.min(Number(range.max), Math.max(Number(range.min), value))],
			];
		}),
	);
	const [path, setPath] = useState<AcquisitionPath>(
		fromSelectedFonts ? 'web' : 'download',
	);
	const [method, setMethod] = useState<Method>('package');
	const [format, setFormat] = useState<FamilyFormat>(
		searchParams.get('format') === 'static' && supportsStatic
			? 'static'
			: supportsVariable
				? 'variable'
				: 'static',
	);
	const [selectedStyles, setSelectedStyles] = useState<FontStyle[]>(
		requestedStyles?.length ? requestedStyles : [recommendedStyle],
	);
	const [selectedWeights, setSelectedWeights] = useState<number[]>(
		requestedWeights?.length ? requestedWeights : [recommendedWeight],
	);
	const [selectedSubsets, setSelectedSubsets] = useState<string[]>(
		requestedSubsets?.length ? requestedSubsets : [preferredSubset],
	);
	const [activeAxes, setActiveAxes] = useState<string[]>(
		requestedActiveAxes?.length ? requestedActiveAxes : defaultActiveAxes,
	);
	const [fontDisplay, setFontDisplay] = useState<FontDisplay>(
		requestedDisplay ?? 'swap',
	);
	const [formats, setFormats] = useState<WebFontFormat[]>(
		requestedFormats?.length ? requestedFormats : ['woff2'],
	);
	const [axisValues, setAxisValues] = useState<Record<string, number>>({
		...defaultAxisValues,
		...requestedAxes,
	});
	const [packageManager, setPackageManager] = useLocalStorage({
		key: 'package-manager',
		defaultValue: 'npm',
		deserialize: (value) =>
			deserializeStoredChoice(value, packageManagerValues, 'npm'),
	});

	const isVariable = format === 'variable' && supportsVariable;
	const availableStyles = [
		...metadata.styles.filter((style) => style === 'normal'),
		...metadata.styles.filter((style) => style !== 'normal'),
	];
	const styles = availableStyles.filter((style) =>
		selectedStyles.includes(style),
	);
	const weights = metadata.weights.filter((weight) =>
		selectedWeights.includes(weight),
	);
	const primaryStyle = styles[0] ?? recommendedStyle;
	const selectedAxisValues = Object.fromEntries(
		activeAxes.map((axis) => [
			axis,
			axisValues[axis] ?? defaultAxisValues[axis],
		]),
	);
	const primaryWeight = isVariable
		? (selectedAxisValues.wght ?? recommendedWeight)
		: (weights[0] ?? recommendedWeight);
	const defaultFormat: FamilyFormat = supportsVariable ? 'variable' : 'static';
	const axesAreDefault = Object.entries(selectedAxisValues).every(
		([axis, value]) => defaultAxisValues[axis] === value,
	);
	const isRecommendedSetup =
		format === defaultFormat &&
		sameValues(styles, [recommendedStyle]) &&
		sameValues(selectedSubsets, [preferredSubset]) &&
		fontDisplay === 'swap' &&
		(isVariable
			? axesAreDefault && sameValues(activeAxes, defaultActiveAxes)
			: sameValues(weights, [recommendedWeight]) &&
				sameValues(formats, ['woff2']));
	const projectItem = createProjectItem({
		metadata,
		versions,
		variable,
		registry,
		format: isVariable ? 'variable' : 'static',
		subset: selectedSubsets[0] ?? preferredSubset,
		style: primaryStyle,
		weight: primaryWeight,
		axes: selectedAxisValues,
		sampleText: getRegistryPreviewText(registry, languages),
	});
	const { packageName, packageVersion } = projectItem;
	const cssOptions = {
		metadata,
		variable,
		isVariable,
		styles,
		weights: isVariable ? metadata.weights : weights,
		subsets: selectedSubsets,
		activeAxes,
		formats,
		display: fontDisplay,
		version: packageVersion,
	};
	const packageFontFaceCSS = buildFamilyUseCSS({
		...cssOptions,
		delivery: 'package',
	});
	const cdnFontFaceCSS = buildFamilyUseCSS({
		...cssOptions,
		delivery: 'cdn',
	});
	const fontSetItem = {
		...projectItem,
		styles,
		weights,
		subsets: selectedSubsets,
		activeAxes,
		formats,
		fontDisplay,
		packageFontFaceCSS,
		cdnFontFaceCSS,
	};
	const installCommand = getPackageManagerCommand(packageManager, packageName);
	const cssCode = getUsageBlock(projectItem);
	const usageMarkup = getUsageMarkup(projectItem);
	const usageNote = getUsageNote(projectItem);
	const variableWeightRange = variable?.axes.wght
		? `${Number(variable.axes.wght.min)}–${Number(variable.axes.wght.max)}`
		: `${Math.min(...metadata.weights)}–${Math.max(...metadata.weights)}`;
	const selectionSummary = isVariable
		? `Variable · ${styles.map(formatFontLabel).join(' + ')} · ${selectedSubsets.length === 1 ? selectedSubsets[0] : `${selectedSubsets.length} subsets`} · display ${fontDisplay}`
		: weights.length === 1 && styles.length === 1
			? `Static · ${formatFontLabel(primaryStyle)} · ${getWeightLabel(primaryWeight)} · display ${fontDisplay}`
			: `Static · ${styles.map(formatFontLabel).join(' + ')} · weights ${weights.join(' + ')} · display ${fontDisplay}`;
	const exampleFace = `${formatFontLabel(primaryStyle)} ${Math.round(primaryWeight)}`;
	const useRecommendedSetup = () => {
		setFormat(defaultFormat);
		setSelectedStyles([recommendedStyle]);
		setSelectedWeights([recommendedWeight]);
		setSelectedSubsets([preferredSubset]);
		setActiveAxes(defaultActiveAxes);
		setFontDisplay('swap');
		setFormats(['woff2']);
		setAxisValues(defaultAxisValues);
	};
	const formatDescription = isVariable
		? `One stylesheet per style, covering weights ${variableWeightRange} and the selected axes.`
		: 'Choose the exact weights and styles your site uses.';
	const fontFaceExplanation =
		method === 'package'
			? 'Add this generated stylesheet to your app after installing the package.'
			: 'Add this version-pinned stylesheet to your CSS. Font files load from jsDelivr.';
	const cssExplanation = isVariable
		? `Applies ${exampleFace} and your current variable-axis values.`
		: `Applies ${exampleFace} from the generated stylesheet.`;

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
							<small className={classes.taskTabDesktop}>
								For design apps, desktop, and font managers
							</small>
							<small className={classes.taskTabCompact}>
								Design and desktop
							</small>
						</span>
					</Tabs.Tab>
					<Tabs.Tab value="web">
						<span className={classes.taskTabLabel}>
							<strong>Developer setup</strong>
							<small className={classes.taskTabDesktop}>
								For packages, frameworks, and CDN
							</small>
							<small className={classes.taskTabCompact}>Packages and CDN</small>
						</span>
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel className={classes.taskPanel} value="download">
					<div className={classes.downloadPanel}>
						<div className={classes.downloadDetails}>
							<h3>Complete family (.zip)</h3>
							<p className={classes.downloadOutcome}>
								Ready for design apps, desktop installation, and font managers.
							</p>
							<p className={classes.downloadContents}>
								Includes every TTF weight and style, plus WOFF and WOFF2
								webfonts, CSS, and the original license.
							</p>
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
								<VisuallyHidden> (opens in a new tab)</VisuallyHidden>
							</a>
							<LicenseReceipt
								familyId={metadata.id}
								license={registry?.license}
								registryState={registryState}
							/>
							<div className={classes.fontSetPrompt}>
								<p>
									<strong>Downloading more fonts?</strong>
									<span>
										Add this family to a font set, keep browsing, and download
										everything together.
									</span>
								</p>
								<ProjectAddButton
									includedLabel="Update font set"
									item={fontSetItem}
									label="Add to font set"
								/>
							</div>
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

						<p className={classes.deliveryNote}>
							{method === 'package'
								? 'Package bundles and self-hosts the font with your app. Recommended.'
								: 'Quick embed loads a versioned stylesheet from jsDelivr when package-based self-hosting is not practical.'}
						</p>

						<div className={classes.configuration}>
							<div className={classes.configurationHeading}>
								<div>
									<strong>Font setup</strong>
									<span>{selectionSummary}</span>
								</div>
								{!isRecommendedSetup && (
									<button
										type="button"
										className={classes.resetButton}
										onClick={useRecommendedSetup}
									>
										Use recommended
									</button>
								)}
							</div>

							{supportsStatic && supportsVariable && (
								<fieldset
									className={classes.formatSwitch}
									aria-describedby="font-format-help"
								>
									<legend>Font type</legend>
									<div>
										<button
											type="button"
											data-active={isVariable || undefined}
											aria-pressed={isVariable}
											onClick={() => setFormat('variable')}
										>
											Variable
										</button>
										<button
											type="button"
											data-active={!isVariable || undefined}
											aria-pressed={!isVariable}
											onClick={() => setFormat('static')}
										>
											Static
										</button>
									</div>
									<p className={classes.selectionHelp} id="font-format-help">
										{formatDescription}
									</p>
								</fieldset>
							)}
							{!(supportsStatic && supportsVariable) && (
								<p className={classes.formatSummary}>{formatDescription}</p>
							)}

							{metadata.subsets.length > 1 && (
								<fieldset
									className={classes.optionGroup}
									aria-describedby={`${metadata.id}-subset-help`}
								>
									<legend>Character sets</legend>
									<p
										className={classes.selectionHelp}
										id={`${metadata.id}-subset-help`}
									>
										Include only the writing systems your site needs.
									</p>
									<div>
										{metadata.subsets.map((subset) => {
											const selected = selectedSubsets.includes(subset);
											const inputId = `${metadata.id}-subset-${subset}`;
											return (
												<label htmlFor={inputId} key={subset}>
													<input
														id={inputId}
														type="checkbox"
														checked={selected}
														disabled={selected && selectedSubsets.length === 1}
														onChange={() =>
															setSelectedSubsets((current) =>
																toggleRequiredValue(
																	current,
																	subset,
																	metadata.subsets,
																),
															)
														}
													/>
													<span>{formatFontLabel(subset)}</span>
												</label>
											);
										})}
									</div>
								</fieldset>
							)}

							{metadata.styles.length > 1 && (
								<fieldset
									className={classes.optionGroup}
									aria-describedby={`${metadata.id}-style-help`}
								>
									<legend>Styles</legend>
									<p
										className={classes.selectionHelp}
										id={`${metadata.id}-style-help`}
									>
										Choose one or more. At least one is required.
									</p>
									<div>
										{availableStyles.map((style) => {
											const selected = styles.includes(style);
											const inputId = `${metadata.id}-style-${style}`;
											return (
												<label htmlFor={inputId} key={style}>
													<input
														id={inputId}
														type="checkbox"
														checked={selected}
														disabled={selected && styles.length === 1}
														onChange={() =>
															setSelectedStyles((current) =>
																toggleRequiredValue(
																	current,
																	style,
																	metadata.styles,
																),
															)
														}
													/>
													<span>{formatFontLabel(style)}</span>
												</label>
											);
										})}
									</div>
								</fieldset>
							)}

							{!isVariable && metadata.weights.length > 1 && (
								<fieldset
									className={classes.optionGroup}
									aria-describedby={`${metadata.id}-weight-help`}
								>
									<legend>Weights</legend>
									<p
										className={classes.selectionHelp}
										id={`${metadata.id}-weight-help`}
									>
										Choose one or more weights. At least one is required.
									</p>
									<div>
										{metadata.weights.map((weight) => {
											const selected = weights.includes(weight);
											const inputId = `${metadata.id}-weight-${weight}`;
											return (
												<label htmlFor={inputId} key={weight}>
													<input
														id={inputId}
														type="checkbox"
														checked={selected}
														disabled={selected && weights.length === 1}
														onChange={() =>
															setSelectedWeights((current) =>
																toggleRequiredValue(
																	current,
																	weight,
																	metadata.weights,
																),
															)
														}
													/>
													<span>{getWeightLabel(weight)}</span>
												</label>
											);
										})}
									</div>
								</fieldset>
							)}

							{isVariable && availableAxes.length > 1 && (
								<fieldset
									className={classes.optionGroup}
									aria-describedby={`${metadata.id}-axes-help`}
								>
									<legend>Variable axes</legend>
									<p
										className={classes.selectionHelp}
										id={`${metadata.id}-axes-help`}
									>
										Choose the controls your project needs. Fewer axes usually
										mean a smaller font file.
									</p>
									<div>
										{availableAxes.map((axis) => {
											const selected = activeAxes.includes(axis);
											const inputId = `${metadata.id}-active-axis-${axis}`;
											return (
												<label htmlFor={inputId} key={axis}>
													<input
														id={inputId}
														type="checkbox"
														checked={selected}
														disabled={selected && activeAxes.length === 1}
														onChange={() =>
															setActiveAxes((current) =>
																toggleRequiredValue(
																	current,
																	axis,
																	availableAxes,
																),
															)
														}
													/>
													<span>{getAxisLabel(axis)}</span>
												</label>
											);
										})}
									</div>
								</fieldset>
							)}

							{isVariable &&
								Object.entries(variable?.axes ?? {})
									.filter(([axis]) => activeAxes.includes(axis))
									.map(([axis, range]) => {
										const value = axisValues[axis] ?? Number(range.default);
										const inputId = `${metadata.id}-axis-${axis}`;
										return (
											<label
												className={classes.axisControl}
												htmlFor={inputId}
												key={axis}
											>
												<span>
													{axis.toLowerCase() === 'wght'
														? 'Example weight'
														: getAxisLabel(axis)}
													<output htmlFor={inputId}>{value}</output>
												</span>
												<input
													id={inputId}
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
													}}
												/>
											</label>
										);
									})}

							<fieldset className={classes.optionGroup}>
								<legend>Font display</legend>
								<p className={classes.selectionHelp}>
									Controls how text behaves while the font loads. Swap is the
									recommended default.
								</p>
								<div>
									{fontDisplays.map((display) => (
										<label
											htmlFor={`${metadata.id}-display-${display}`}
											key={display}
										>
											<input
												id={`${metadata.id}-display-${display}`}
												type="radio"
												name={`${metadata.id}-font-display`}
												checked={fontDisplay === display}
												onChange={() => setFontDisplay(display)}
											/>
											<span>{formatFontLabel(display)}</span>
										</label>
									))}
								</div>
							</fieldset>

							{!isVariable && (
								<fieldset className={classes.optionGroup}>
									<legend>Webfont formats</legend>
									<p className={classes.selectionHelp}>
										WOFF2 is recommended. Add WOFF only for older browser
										support.
									</p>
									<div>
										{webFontFormats.map((webFormat) => {
											const selected = formats.includes(webFormat);
											return (
												<label
													htmlFor={`${metadata.id}-web-format-${webFormat}`}
													key={webFormat}
												>
													<input
														id={`${metadata.id}-web-format-${webFormat}`}
														type="checkbox"
														checked={selected}
														disabled={selected && formats.length === 1}
														onChange={() =>
															setFormats((current) =>
																toggleRequiredValue(
																	current,
																	webFormat,
																	webFontFormats,
																),
															)
														}
													/>
													<span>{webFormat.toUpperCase()}</span>
												</label>
											);
										})}
									</div>
								</fieldset>
							)}
						</div>

						<div className={classes.fontSetPrompt}>
							<p>
								<strong>Building a font stack?</strong>
								<span>
									Save this setup, keep browsing, and generate combined code
									later.
								</span>
							</p>
							<ProjectAddButton item={fontSetItem} />
						</div>

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
								code={
									method === 'package' ? packageFontFaceCSS : cdnFontFaceCSS
								}
								description={fontFaceExplanation}
								label="Font-face CSS"
								language="css"
							/>
							<CopyCodeBlock
								code={cssCode}
								description={cssExplanation}
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
