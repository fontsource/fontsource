import { Tabs, VisuallyHidden } from '@mantine/core';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { CopyCodeBlock } from '@/components/code/CopyCodeBlock';
import { IconDownload, IconExternal } from '@/components/icons';
import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetRegistrySubsetResponse,
	GetVariableFontResponse,
} from '@/generated/api';
import { usePackageManager } from '@/hooks/usePackageManager';
import { getJsDelivrPackageUrl } from '@/utils/cdn';
import {
	getPackageManagerCommand,
	packageManagers,
} from '@/utils/docs/packageManagers';
import {
	fontWeightNames,
	formatFontLabel,
	getAxisLabel,
} from '@/utils/font-labels';
import { getPreferredPreviewSubset } from '@/utils/font-preview';
import type { RegistryDataState, RegistryFamily } from '@/utils/registry';

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
	subsetDefinitions?: GetRegistrySubsetResponse[];
}

type Method = 'package' | 'cdn';
type AcquisitionPath = 'download' | 'web';
type FamilyFormat = 'variable' | 'static';
type FontStyle = GetFontResponse['styles'][number];

interface RequiredOptionGroupProps<T extends number | string> {
	description: string;
	id: string;
	legend: string;
	onChange: (value: T) => void;
	options: readonly T[];
	selected: readonly T[];
	toLabel: (value: T) => string;
}

const RequiredOptionGroup = <T extends number | string>({
	description,
	id,
	legend,
	onChange,
	options,
	selected,
	toLabel,
}: RequiredOptionGroupProps<T>) => (
	<fieldset className={classes.optionGroup} aria-describedby={`${id}-help`}>
		<legend>{legend}</legend>
		<p className={classes.selectionHelp} id={`${id}-help`}>
			{description}
		</p>
		<div>
			{options.map((option) => {
				const checked = selected.includes(option);
				const inputId = `${id}-${option}`;

				return (
					<label htmlFor={inputId} key={option}>
						<input
							id={inputId}
							type="checkbox"
							checked={checked}
							disabled={checked && selected.length === 1}
							onChange={() => onChange(option)}
						/>
						<span>{toLabel(option)}</span>
					</label>
				);
			})}
		</div>
	</fieldset>
);

const toggleRequiredValue = <T,>(selected: T[], value: T, available: T[]) => {
	const next = selected.includes(value)
		? selected.length === 1
			? selected
			: selected.filter((item) => item !== value)
		: [...selected, value];
	return available.filter((item) => next.includes(item));
};

const sameValues = <T,>(left: T[], right: T[]) =>
	left.length === right.length && left.every((value) => right.includes(value));

const getWeightLabel = (weight: number) =>
	fontWeightNames[weight]
		? `${weight} ${fontWeightNames[weight]}`
		: String(weight);

export const FamilyUse = ({
	metadata,
	staticCSS,
	variable,
	variableCSS,
	versions,
	registry,
	registryState,
	subsetDefinitions,
}: FamilyUseProps) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const supportsVariable = Boolean(variable && versions.latestVariable);
	const supportsStatic = Boolean(versions.latest);
	const preferredSubset = getPreferredPreviewSubset(metadata, registry);
	const recommendedStyle = metadata.styles.includes('normal')
		? 'normal'
		: (metadata.styles[0] ?? 'normal');
	const recommendedWeight = metadata.weights.includes(400)
		? 400
		: (metadata.weights[0] ?? 400);
	const availableAxes = Object.keys(variable?.axes ?? {}).filter(
		(axis) => axis.toLowerCase() !== 'ital',
	);
	const defaultActiveAxes = availableAxes.includes('wght')
		? ['wght']
		: availableAxes.slice(0, 1);
	const defaultPath: AcquisitionPath = 'download';
	const requestedPath = searchParams.get('tab');
	const path: AcquisitionPath =
		requestedPath === 'download' || requestedPath === 'web'
			? requestedPath
			: defaultPath;
	const method: Method =
		searchParams.get('method') === 'cdn' ? 'cdn' : 'package';
	const requestedSetup = searchParams.get('setup');
	const setup =
		requestedSetup === 'simple' || requestedSetup === 'custom'
			? requestedSetup
			: 'simple';
	const customSetup = setup === 'custom';

	const setNavigationChoice = (
		parameter: 'tab' | 'method' | 'setup',
		value: string,
		defaultValue: string,
	) => {
		const next = new URLSearchParams(searchParams);
		if (value === defaultValue) next.delete(parameter);
		else next.set(parameter, value);
		setSearchParams(next, {
			flushSync: true,
			preventScrollReset: true,
		});
	};
	const [format, setFormat] = useState<FamilyFormat>(
		supportsVariable ? 'variable' : 'static',
	);
	const [selectedStyles, setSelectedStyles] = useState<FontStyle[]>([
		recommendedStyle,
	]);
	const [selectedWeights, setSelectedWeights] = useState<number[]>([
		recommendedWeight,
	]);
	const selectedSubsets = metadata.subsets.length
		? metadata.subsets
		: [preferredSubset];
	const [activeAxes, setActiveAxes] = useState<string[]>(defaultActiveAxes);
	const [fontDisplay, setFontDisplay] = useState<FontDisplay>('swap');
	const [formats, setFormats] = useState<WebFontFormat[]>(['woff2']);
	const [packageManager, setPackageManager] = usePackageManager('npm');

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
	const primaryWeight = weights[0] ?? recommendedWeight;
	const defaultFormat: FamilyFormat = supportsVariable ? 'variable' : 'static';
	const isDefaultSetup =
		format === defaultFormat &&
		sameValues(styles, [recommendedStyle]) &&
		fontDisplay === 'swap' &&
		(isVariable
			? sameValues(activeAxes, defaultActiveAxes)
			: sameValues(weights, [recommendedWeight]) &&
				sameValues(formats, ['woff2']));
	const packageName = isVariable
		? `@fontsource-variable/${metadata.id}`
		: `@fontsource/${metadata.id}`;
	const packageVersion = isVariable
		? (versions.latestVariable ?? versions.latest)
		: versions.latest;
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
		subsetDefinitions,
	};
	const packageFontFaceCSS = buildFamilyUseCSS({
		...cssOptions,
		delivery: 'package',
	});
	const cdnFontFaceCSS = buildFamilyUseCSS({
		...cssOptions,
		delivery: 'cdn',
	});
	const installCommand = getPackageManagerCommand(packageManager, packageName);
	const packageImport = `import '${packageName}';`;
	const cdnImport = `@import url('${getJsDelivrPackageUrl(
		packageName,
		packageVersion,
		'index.css',
	)}');`;
	const minWeight = variable?.axes.wght
		? Number(variable.axes.wght.min)
		: Math.min(...metadata.weights);
	const maxWeight = variable?.axes.wght
		? Number(variable.axes.wght.max)
		: Math.max(...metadata.weights);
	const variableWeightRange = `${minWeight}–${maxWeight}`;
	const selectionSummary = isVariable
		? `Variable · ${styles.map(formatFontLabel).join(' + ')} · display ${fontDisplay}`
		: weights.length === 1 && styles.length === 1
			? `Static · ${formatFontLabel(primaryStyle)} · ${getWeightLabel(primaryWeight)} · display ${fontDisplay}`
			: `Static · ${styles.map(formatFontLabel).join(' + ')} · weights ${weights.join(' + ')} · display ${fontDisplay}`;
	const hasSlicedSelection = subsetDefinitions?.some(
		(definition) =>
			selectedSubsets.includes(definition.id) && definition.slices?.length,
	);
	const resetToSimpleSetup = () => {
		setFormat(defaultFormat);
		setSelectedStyles([recommendedStyle]);
		setSelectedWeights([recommendedWeight]);
		setActiveAxes(defaultActiveAxes);
		setFontDisplay('swap');
		setFormats(['woff2']);
	};
	const formatDescription = isVariable
		? `Each selected style uses one stylesheet covering weights ${variableWeightRange} and the selected axes.`
		: 'Choose the exact fixed weights and styles your site uses.';
	const packageImportLead = (
		<>
			<Link to="/docs/getting-started/install">Import once</Link> in your app
			entry file.
		</>
	);
	const unicodeRangeLink = (
		<a
			href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/unicode-range"
			target="_blank"
			rel="noreferrer"
		>
			Unicode ranges
		</a>
	);
	const standardImportDescription = isVariable ? (
		<>
			{method === 'package' ? packageImportLead : 'Add this to your CSS.'} All
			weights from {variableWeightRange} are available, while {unicodeRangeLink}{' '}
			let the browser fetch only the characters it needs.
		</>
	) : method === 'package' ? (
		<>
			{packageImportLead} The package provides the default face and handles{' '}
			{unicodeRangeLink} automatically.
		</>
	) : (
		<>
			Add this to your CSS. The aggregate stylesheet includes all{' '}
			{unicodeRangeLink} required by the font.
		</>
	);
	const fontFaceExplanation =
		method === 'package'
			? 'Paste this into a stylesheet after installing the package. Your bundler resolves the local font files.'
			: `Paste this version-pinned CSS into your project. Font files load from jsDelivr.${hasSlicedSelection ? ' Every Unicode slice published for the family is included.' : ''}`;
	return (
		<section className={classes.page} aria-labelledby="use-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: variableCSS ?? staticCSS }}
			/>
			<div className={classes.heading}>
				<h2 id="use-heading">Get {metadata.family}</h2>
				<p>Choose where you want to use {metadata.family}.</p>
			</div>
			<Tabs
				className={classes.acquisition}
				value={path}
				onChange={(value) => {
					if (value && value !== path) {
						setNavigationChoice('tab', value, defaultPath);
					}
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
								onClick={() => {
									if (method !== 'package') {
										setNavigationChoice('method', 'package', 'package');
									}
								}}
							>
								Package
							</button>
							<button
								type="button"
								data-active={method === 'cdn' || undefined}
								aria-pressed={method === 'cdn'}
								onClick={() => {
									if (method !== 'cdn') {
										setNavigationChoice('method', 'cdn', 'package');
									}
								}}
							>
								CDN
							</button>
						</fieldset>

						<p className={classes.deliveryNote}>
							{method === 'package'
								? 'Install the font from npm and bundle it with your app.'
								: 'Load a version-pinned stylesheet from jsDelivr without installing a package.'}
						</p>

						<fieldset className={classes.setupSwitch}>
							<VisuallyHidden component="legend">
								Choose the level of font setup
							</VisuallyHidden>
							<button
								type="button"
								data-active={!customSetup || undefined}
								aria-pressed={!customSetup}
								onClick={() => {
									if (setup !== 'simple') {
										setNavigationChoice('setup', 'simple', 'simple');
									}
								}}
							>
								Simple
							</button>
							<button
								type="button"
								data-active={customSetup || undefined}
								aria-pressed={customSetup}
								onClick={() => {
									if (setup !== 'custom') {
										setNavigationChoice('setup', 'custom', 'simple');
									}
								}}
							>
								Custom CSS
							</button>
						</fieldset>

						{customSetup && (
							<div className={classes.configuration}>
								<div className={classes.configurationHeading}>
									<div>
										<strong>Custom font setup</strong>
										<span>{selectionSummary}</span>
									</div>
									{!isDefaultSetup && (
										<button
											type="button"
											className={classes.resetButton}
											onClick={resetToSimpleSetup}
										>
											Reset options
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

								{metadata.styles.length > 1 && (
									<RequiredOptionGroup
										description="Choose one or more. At least one is required."
										id={`${metadata.id}-style`}
										legend="Styles"
										onChange={(style) =>
											setSelectedStyles((current) =>
												toggleRequiredValue(current, style, metadata.styles),
											)
										}
										options={availableStyles}
										selected={styles}
										toLabel={formatFontLabel}
									/>
								)}

								{!isVariable && metadata.weights.length > 1 && (
									<RequiredOptionGroup
										description="Choose one or more weights. At least one is required."
										id={`${metadata.id}-weight`}
										legend="Weights"
										onChange={(weight) =>
											setSelectedWeights((current) =>
												toggleRequiredValue(current, weight, metadata.weights),
											)
										}
										options={metadata.weights}
										selected={weights}
										toLabel={getWeightLabel}
									/>
								)}

								{isVariable && availableAxes.length > 1 && (
									<RequiredOptionGroup
										description="Choose the controls your project needs. Generated CSS uses each selected axis’s font default."
										id={`${metadata.id}-active-axis`}
										legend="Variable axes"
										onChange={(axis) =>
											setActiveAxes((current) =>
												toggleRequiredValue(current, axis, availableAxes),
											)
										}
										options={availableAxes}
										selected={activeAxes}
										toLabel={getAxisLabel}
									/>
								)}

								<fieldset className={classes.optionGroup}>
									<legend>Font display</legend>
									<p className={classes.selectionHelp}>
										Controls how text behaves while the font loads. Swap is the
										default.
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
									<RequiredOptionGroup
										description="WOFF2 is the default. Add WOFF only for older browser support."
										id={`${metadata.id}-web-format`}
										legend="Webfont formats"
										onChange={(webFormat) =>
											setFormats((current) =>
												toggleRequiredValue(current, webFormat, webFontFormats),
											)
										}
										options={webFontFormats}
										selected={formats}
										toLabel={(webFormat) => webFormat.toUpperCase()}
									/>
								)}
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
							{!customSetup ? (
								<CopyCodeBlock
									code={method === 'package' ? packageImport : cdnImport}
									description={standardImportDescription}
									label={method === 'package' ? 'Import' : 'Stylesheet import'}
									language={method === 'package' ? 'js' : 'css'}
								/>
							) : (
								<CopyCodeBlock
									code={
										method === 'package' ? packageFontFaceCSS : cdnFontFaceCSS
									}
									description={fontFaceExplanation}
									label="Font-face CSS"
									language="css"
									scrollable
								/>
							)}
							<p className={classes.weightRange}>
								<span>
									{minWeight === maxWeight
										? 'Available weight'
										: 'Weight range'}
								</span>
								<strong>
									{minWeight === maxWeight ? minWeight : variableWeightRange}
								</strong>
							</p>
						</div>
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
