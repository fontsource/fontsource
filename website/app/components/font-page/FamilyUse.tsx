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
	buildFamilyUsageCSS,
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
	previewCSS: string;
	registry?: RegistryFamily;
	registryState: RegistryDataState;
	subsetDefinitions?: GetRegistrySubsetResponse[];
}

type Method = 'package' | 'cdn';
type AcquisitionPath = 'download' | 'web';
type FamilyFormat = 'variable' | 'static';
type FontStyle = GetFontResponse['styles'][number];
type NavigationParameter = 'tab' | 'method' | 'setup';

const navigationDefaults: Record<NavigationParameter, string> = {
	tab: 'download',
	method: 'package',
	setup: 'simple',
};

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
	previewCSS,
	variable,
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
	const path: AcquisitionPath =
		searchParams.get('tab') === 'web' ? 'web' : 'download';
	const method: Method =
		searchParams.get('method') === 'cdn' ? 'cdn' : 'package';
	const customSetup = searchParams.get('setup') === 'custom';

	const setNavigationChoice = (
		parameter: NavigationParameter,
		value: string,
	) => {
		const next = new URLSearchParams(searchParams);
		if (value === navigationDefaults[parameter]) next.delete(parameter);
		else next.set(parameter, value);
		setSearchParams(next, {
			flushSync: true,
			preventScrollReset: true,
		});
	};
	const defaultFormat: FamilyFormat = supportsVariable ? 'variable' : 'static';
	const [format, setFormat] = useState<FamilyFormat>(defaultFormat);
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
	const fontFaceCSS = customSetup
		? buildFamilyUseCSS({
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
				delivery: method,
			})
		: '';
	const installCommand = getPackageManagerCommand(packageManager, packageName);
	const standardImport =
		method === 'package'
			? `import '${packageName}';`
			: `@import url('${getJsDelivrPackageUrl(
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
	const usageCSS = buildFamilyUsageCSS(
		metadata,
		isVariable,
		primaryWeight,
		primaryStyle,
	);
	const usageDescription = isVariable
		? `Apply the family, then choose any font weight from ${variableWeightRange}. ${primaryWeight} is a practical starting point.`
		: `Apply the selected ${getWeightLabel(primaryWeight).toLowerCase()} ${primaryStyle} face.`;
	const resetToSimpleSetup = () => {
		setFormat(defaultFormat);
		setSelectedStyles([recommendedStyle]);
		setSelectedWeights([recommendedWeight]);
		setActiveAxes(defaultActiveAxes);
		setFontDisplay('swap');
		setFormats(['woff2']);
	};
	const formatDescription = isVariable
		? `Covers every weight from ${variableWeightRange} in each selected style. Best for flexible typography.`
		: 'Creates CSS for only the fixed weights and styles you select.';
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
			: 'Paste this version-pinned CSS into your project. Font files load from jsDelivr.';
	return (
		<section className={classes.page} aria-labelledby="use-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: previewCSS }}
			/>
			<div className={classes.heading}>
				<h2 id="use-heading">Get {metadata.family}</h2>
				<p>
					Download the full family for design tools, or add it to a website.
				</p>
			</div>
			<Tabs
				className={classes.acquisition}
				value={path}
				onChange={(value) => {
					if (value && value !== path) {
						setNavigationChoice('tab', value);
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
								Includes every desktop TTF weight and style. A separate webfonts
								folder contains WOFF, WOFF2, CSS, and the original license.
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
						<div className={classes.deliveryHeader}>
							<fieldset className={classes.controlGroup}>
								<legend className={classes.controlLabel}>Delivery</legend>
								<div className={classes.methodSwitch}>
									<button
										type="button"
										data-active={method === 'package' || undefined}
										aria-pressed={method === 'package'}
										onClick={() => {
											if (method !== 'package') {
												setNavigationChoice('method', 'package');
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
												setNavigationChoice('method', 'cdn');
											}
										}}
									>
										CDN
									</button>
								</div>
							</fieldset>
							<fieldset className={classes.controlGroup}>
								<legend className={classes.controlLabel}>CSS output</legend>
								<div className={classes.setupSwitch}>
									<button
										type="button"
										data-active={!customSetup || undefined}
										aria-pressed={!customSetup}
										onClick={() => {
											if (customSetup) {
												setNavigationChoice('setup', 'simple');
											}
										}}
									>
										Ready-made
									</button>
									<button
										type="button"
										data-active={customSetup || undefined}
										aria-pressed={customSetup}
										onClick={() => {
											if (!customSetup) {
												setNavigationChoice('setup', 'custom');
											}
										}}
									>
										Custom CSS
									</button>
								</div>
							</fieldset>

							<p className={classes.deliveryNote}>
								{method === 'package'
									? customSetup
										? 'Install the package, then generate explicit font-face CSS for the files you choose.'
										: 'Install the package and import its ready-made stylesheet. Your app serves the font files.'
									: customSetup
										? 'Generate version-pinned font-face CSS for the files you choose. Fonts load from jsDelivr.'
										: 'Load the ready-made stylesheet from jsDelivr. No package manager or build step is needed.'}
							</p>
						</div>

						{customSetup && (
							<div className={classes.configuration}>
								<div className={classes.configurationHeading}>
									<div>
										<strong>Custom font setup</strong>
										<span>
											Choose the files and loading behavior your project needs.
										</span>
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
										Swap shows fallback text immediately. Change this only when
										your loading strategy needs different behavior.
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

						<ol className={classes.instructions}>
							{method === 'package' && (
								<li className={classes.instructionStep}>
									<div className={classes.instructionBody}>
										<fieldset className={classes.manager}>
											<legend>Package manager</legend>
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
										<CopyCodeBlock
											code={installCommand}
											compact
											label="Install"
											language="sh"
										/>
										<Link
											className={classes.guideLink}
											to="/docs/getting-started/install"
										>
											Read the installation guide
											<IconExternal
												aria-hidden
												height={15}
												stroke="currentColor"
											/>
										</Link>
									</div>
								</li>
							)}
							<li className={classes.instructionStep}>
								<div className={classes.instructionBody}>
									{!customSetup ? (
										<CopyCodeBlock
											code={standardImport}
											compact
											description={standardImportDescription}
											label={
												method === 'package' ? 'Import' : 'Stylesheet import'
											}
											language={method === 'package' ? 'js' : 'css'}
										/>
									) : (
										<CopyCodeBlock
											code={fontFaceCSS}
											description={fontFaceExplanation}
											label="Font-face CSS"
											language="css"
											scrollable
										/>
									)}
									{method === 'cdn' && (
										<Link
											className={classes.guideLink}
											to="/docs/getting-started/install"
										>
											Read the web font guide
											<IconExternal
												aria-hidden
												height={15}
												stroke="currentColor"
											/>
										</Link>
									)}
								</div>
							</li>
							<li className={classes.instructionStep}>
								<div className={classes.instructionBody}>
									<CopyCodeBlock
										code={usageCSS}
										description={usageDescription}
										label="Use the font"
										language="css"
									/>
								</div>
							</li>
						</ol>
					</div>
				</Tabs.Panel>
			</Tabs>
		</section>
	);
};
