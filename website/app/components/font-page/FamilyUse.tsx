import { selectVariableAxisKey } from '@fontsource-utils/core';
import { useClipboard, useLocalStorage } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { IconCopy, IconDownload, IconExternal } from '@/components/icons';
import { createProjectItem } from '@/features/projects/createProjectItem';
import { ProjectAddButton } from '@/features/projects/ProjectAddButton';
import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetVariableFontResponse,
} from '@/generated/api';
import { deserializeStoredChoice } from '@/utils/browser-storage';
import { packageManagers } from '@/utils/docs/packageManagers';
import { triggerBlobDownload } from '@/utils/download';
import { readFontPreviewSelection } from '@/utils/font-preview-selection';
import {
	hasSymbolCatalog,
	isDigitalFontFamily,
	isPunctuationFontFamily,
	type RegistryFamily,
	usesNameLigatures,
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
	registryUnavailable?: boolean;
}

type Path = 'download' | 'web';
type Method = 'package' | 'cdn';
type FamilyFormat = 'variable' | 'static';
type DownloadState = 'idle' | 'fetching' | 'building' | 'success' | 'error';
const packageManagerValues = packageManagers.map((manager) => manager.value);

const humanize = (value: string) =>
	value
		.split(/[-_]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

const fallbacks: Record<GetFontResponse['category'], string> = {
	'sans-serif': 'sans-serif',
	serif: 'serif',
	display: 'serif',
	handwriting: 'cursive',
	monospace: 'monospace',
	icons: 'sans-serif',
	other: 'sans-serif',
};

const axisNames: Record<string, string> = {
	FILL: 'Fill',
	GRAD: 'Grade',
	SOFT: 'Softness',
	WONK: 'Wonky',
	opsz: 'Optical size',
	slnt: 'Slant',
	wdth: 'Width',
	wght: 'Weight',
};

const getUsageDetails = (
	metadata: GetFontResponse,
	registry: RegistryFamily | undefined,
	familyName: string,
	isVariable: boolean,
	axisValues: Record<string, number>,
	weight: number,
	style: GetFontResponse['styles'][number],
) => {
	const hasNamedLigatures = usesNameLigatures(registry);
	const isPunctuationFamily = isPunctuationFontFamily(registry);
	const isDigitalFamily = isDigitalFontFamily(registry);
	const sampleText =
		registry?.sampleText?.tester?.trim() ??
		registry?.sampleText?.styles?.trim() ??
		metadata.family;
	const sampleName = sampleText.split(/\s+/)[0] ?? sampleText;
	const escapedSampleText = sampleText
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
	const className = `font-${metadata.id}`;
	const formatCss = (declarations: string[]) =>
		`.${className} {\n${declarations.map((line) => `  ${line}`).join('\n')}\n}`;

	if (hasNamedLigatures) {
		const settings = isVariable
			? Object.entries(axisValues)
					.map(([axis, value]) => `'${axis}' ${value}`)
					.join(', ')
			: '';
		const declarations = [
			`font-family: '${familyName}';`,
			'font-style: normal;',
			'font-weight: normal;',
			'line-height: 1;',
			'text-transform: none;',
			'white-space: nowrap;',
			"font-feature-settings: 'liga';",
		];

		if (settings) {
			declarations.push(`font-variation-settings: ${settings};`);
		}

		return {
			css: formatCss(declarations),
			markup: `<span class="${className}" aria-hidden="true">${escapedSampleText}</span>`,
			note: isVariable
				? `Use a verified catalog name such as ${sampleName}. This setup loads every variable axis so the CSS values above remain available.`
				: `Use a verified catalog name such as ${sampleName}. The font turns that name into the matching symbol.`,
		};
	}

	if (isPunctuationFamily) {
		return {
			css: formatCss([
				`font-family: '${familyName}', 'Noto Sans JP', sans-serif;`,
				`font-weight: ${weight};`,
				`font-style: ${style};`,
			]),
			markup: `<p class="${className}">${escapedSampleText}</p>`,
			note: `${metadata.family} replaces Japanese punctuation only. Keep it first, followed by the Japanese text font used by your project.`,
		};
	}

	if (isDigitalFamily) {
		return {
			css: formatCss([
				`font-family: '${familyName}', monospace;`,
				`font-weight: ${weight};`,
				`font-style: ${style};`,
				'font-variant-numeric: tabular-nums;',
				"font-feature-settings: 'tnum';",
				'white-space: nowrap;',
			]),
			markup: `<span class="${className}">${escapedSampleText}</span>`,
			note: 'Tabular numerals and a single-line container keep changing readout values aligned.',
		};
	}

	return {
		css: formatCss([
			`font-family: '${familyName}', ${fallbacks[metadata.category]};`,
			`font-weight: ${weight};`,
			`font-style: ${style};`,
		]),
	};
};

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
	const clipboard = useClipboard({ timeout: 1500 });
	const copyLabel = clipboard.copied
		? 'Copied'
		: clipboard.error
			? 'Copy failed'
			: 'Copy';

	return (
		<div className={classes.codeBlock}>
			<div className={classes.codeHeader}>
				<span>{language}</span>
				<button type="button" onClick={() => clipboard.copy(code)}>
					<IconCopy aria-hidden height={16} stroke="currentColor" />
					<span aria-live="polite" aria-atomic="true">
						{copyLabel}
					</span>
				</button>
			</div>
			<pre>
				<code>{code}</code>
			</pre>
		</div>
	);
};

const CopyCompleteSetup = ({ code }: { code: string }) => {
	const clipboard = useClipboard({ timeout: 1500 });
	const copyLabel = clipboard.copied
		? 'Setup copied'
		: clipboard.error
			? 'Copy failed — use the steps below'
			: 'Copy complete setup';

	return (
		<button
			type="button"
			className={classes.completeSetupButton}
			onClick={() => clipboard.copy(code)}
		>
			<IconCopy aria-hidden height={17} stroke="currentColor" />
			<span aria-live="polite" aria-atomic="true">
				{copyLabel}
			</span>
		</button>
	);
};

export const FamilyUse = ({
	metadata,
	staticCSS,
	variable,
	variableCSS,
	versions,
	registry,
	registryUnavailable = false,
}: FamilyUseProps) => {
	const [searchParams] = useSearchParams();
	const hasCatalog = hasSymbolCatalog(registry);
	const hasNamedLigatures = usesNameLigatures(registry);
	const isPunctuationFamily = isPunctuationFontFamily(registry);
	const isDigitalFamily = isDigitalFontFamily(registry);
	const supportsVariable = Boolean(variable && versions.latestVariable);
	const [path, setPath] = useLocalStorage<Path | null>({
		key: 'fontsource-acquisition-path',
		defaultValue: null,
		deserialize: (value) =>
			deserializeStoredChoice(value, ['download', 'web', null] as const, null),
	});
	const [method, setMethod] = useState<Method>('package');
	const [format, setFormat] = useState<FamilyFormat>(
		supportsVariable ? 'variable' : 'static',
	);
	const [subset, setSubset] = useState(metadata.defSubset);
	const [style, setStyle] = useState<GetFontResponse['styles'][number]>(
		metadata.styles.includes('normal')
			? 'normal'
			: (metadata.styles[0] ?? 'normal'),
	);
	const [weight, setWeight] = useState(
		metadata.weights.includes(400) ? 400 : metadata.weights[0],
	);
	const recommendedStyle = metadata.styles.includes('normal')
		? 'normal'
		: (metadata.styles[0] ?? 'normal');
	const recommendedWeight = metadata.weights.includes(400)
		? 400
		: metadata.weights[0];
	const [downloadFormat, setDownloadFormat] = useState<FamilyFormat>('static');
	const [downloadState, setDownloadState] = useState<DownloadState>('idle');
	const [downloadError, setDownloadError] = useState<string>();
	const downloadInFlight = useRef(false);
	const downloadController = useRef<AbortController | null>(null);
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [loadOnlySelection, setLoadOnlySelection] = useState(false);
	const defaultAxisValues = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(variable?.axes ?? {}).map(([axis, range]) => [
					axis,
					Number(range.default),
				]),
			),
		[variable],
	);
	const [axisValues, setAxisValues] =
		useState<Record<string, number>>(defaultAxisValues);
	const [previewSettingsApplied, setPreviewSettingsApplied] = useState(false);
	const [packageManager, setPackageManager] = useLocalStorage({
		key: 'package-manager',
		defaultValue: 'pnpm',
		deserialize: (value) =>
			deserializeStoredChoice(value, packageManagerValues, 'pnpm'),
	});
	const isVariable = format === 'variable' && supportsVariable;
	const packageName = isVariable
		? `@fontsource-variable/${metadata.id}`
		: `@fontsource/${metadata.id}`;
	const version = isVariable
		? (versions.latestVariable ?? versions.latest)
		: versions.latest;
	const familyName = isVariable
		? `${metadata.family} Variable`
		: metadata.family;
	const iconUsesMultipleAxes =
		hasCatalog && isVariable && Object.keys(variable?.axes ?? {}).length > 1;
	const subsetLabel = hasCatalog ? 'Package subset' : 'Character set';
	const subsetValueLabel = hasCatalog
		? `${humanize(subset)} ${hasNamedLigatures ? 'symbol ligatures' : 'symbols'}`
		: humanize(subset);
	const axisKey = variable
		? selectVariableAxisKey(
				variable.axes,
				Object.keys(variable.axes),
			).toLowerCase()
		: 'wght';
	const stylesheet = isVariable
		? `${subset}-${axisKey}${style === 'italic' ? '-italic' : ''}.css`
		: `${subset}-${weight}${style === 'italic' ? '-italic' : ''}.css`;
	const installCommand = useMemo(() => {
		const manager =
			packageManagers.find((item) => item.value === packageManager) ??
			packageManagers[0];
		return manager.command(packageName);
	}, [packageManager, packageName]);
	const importPath = iconUsesMultipleAxes
		? `${packageName}/full.css`
		: loadOnlySelection
			? `${packageName}/${stylesheet}`
			: packageName;
	const cdnPath = iconUsesMultipleAxes
		? 'full.css'
		: loadOnlySelection
			? stylesheet
			: 'index.css';
	const cdnUrl = `https://cdn.jsdelivr.net/npm/${packageName}@${version}/${cdnPath}`;
	const effectiveAxisValues =
		isVariable && variable?.axes.wght
			? { ...axisValues, wght: weight }
			: axisValues;
	const {
		css: cssCode,
		markup: usageMarkup,
		note: usageNote,
	} = getUsageDetails(
		metadata,
		registry,
		familyName,
		isVariable,
		effectiveAxisValues,
		weight,
		style,
	);
	const proofText =
		registry?.sampleText?.tester?.trim() ??
		registry?.sampleText?.styles?.trim() ??
		metadata.family;
	const proofVariationSettings = Object.entries(effectiveAxisValues)
		.map(([axis, value]) => `'${axis}' ${value}`)
		.join(', ');
	const fromSelectedFonts = searchParams.get('from') === 'selected-fonts';
	const completeSetup = [
		method === 'package'
			? `# Install\n${installCommand}\n\n// Import\nimport '${importPath}';`
			: `<!-- Add to your document head -->\n<link rel="stylesheet" href="${cdnUrl}">`,
		`/* Apply the font */\n${cssCode}`,
		usageMarkup ? `<!-- Example markup -->\n${usageMarkup}` : undefined,
	]
		.filter(Boolean)
		.join('\n\n');
	const downloadIsVariable = downloadFormat === 'variable' && supportsVariable;
	const downloadVersion = downloadIsVariable
		? (versions.latestVariable ?? versions.latest)
		: versions.latest;
	const downloadAxisKey =
		hasCatalog &&
		downloadIsVariable &&
		Object.keys(variable?.axes ?? {}).length > 1
			? 'full'
			: axisKey;
	const downloadAssetFile = downloadIsVariable
		? `${subset}-${downloadAxisKey}-${style}.woff2`
		: `${subset}-${weight}-${style}.ttf`;
	const downloadTag = downloadIsVariable
		? `${metadata.id}:vf@${downloadVersion}`
		: `${metadata.id}@${downloadVersion}`;
	const downloadAssetUrl = `https://api.fontsource.org/fonts/${encodeURIComponent(downloadTag)}/${encodeURIComponent(downloadAssetFile)}`;
	const downloadArchiveName = `${metadata.id}-${subset}-${downloadIsVariable ? 'variable' : `${weight}-${style}`}.zip`;
	const downloadDescription = hasCatalog
		? 'This archive contains the selected symbol font file.'
		: isPunctuationFamily
			? `${metadata.family} adjusts Japanese punctuation. Pair it with the Japanese text font used by your project.`
			: isDigitalFamily
				? 'This setup contains one display face. The complete family archive includes every published variation.'
				: downloadIsVariable
					? 'One flexible webfont file contains the available weight range.'
					: 'A desktop-ready TTF for the selected weight, style, and character set.';
	const isPreparingDownload =
		downloadState === 'fetching' || downloadState === 'building';
	const hasVerifiedLicenseText = Boolean(registry?.license.text.trim());
	const downloadButtonLabel = !hasVerifiedLicenseText
		? 'License verification required'
		: downloadState === 'fetching'
			? 'Fetching files…'
			: downloadState === 'building'
				? 'Building archive…'
				: downloadState === 'error'
					? 'Try again'
					: downloadState === 'success'
						? 'Download again'
						: 'Download selected .zip';
	const downloadStatus = !hasVerifiedLicenseText
		? 'The registry license text must be available before Fontsource can build this custom archive.'
		: downloadState === 'fetching'
			? 'Fetching the selected font and license…'
			: downloadState === 'building'
				? `Building ${downloadArchiveName} in your browser…`
				: downloadState === 'success'
					? `Downloaded ${downloadArchiveName}.`
					: downloadState === 'error'
						? (downloadError ??
							'The custom archive could not be prepared. Your settings are preserved; try again or download the complete family.')
						: 'Ready to create a ZIP in your browser.';

	const clearDownloadFeedback = () => {
		setDownloadState('idle');
		setDownloadError(undefined);
	};

	const resetDownload = () => {
		setDownloadFormat('static');
		setSubset(metadata.defSubset);
		setStyle(recommendedStyle);
		setWeight(recommendedWeight);
		clearDownloadFeedback();
		setPreviewSettingsApplied(false);
	};

	const downloadSelectedFiles = async () => {
		if (!registry?.license.text.trim() || downloadInFlight.current) return;

		downloadInFlight.current = true;
		const controller = new AbortController();
		downloadController.current = controller;
		let timedOut = false;
		let responseError: string | undefined;
		const timeout = window.setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, 30_000);

		setDownloadError(undefined);
		setDownloadState('fetching');

		try {
			const [fontResponse, { strToU8, zipSync }] = await Promise.all([
				fetch(downloadAssetUrl, { signal: controller.signal }),
				import('fflate'),
			]);
			if (!fontResponse.ok) {
				responseError =
					fontResponse.status === 404
						? 'That exact font file is not available. Try another format or download the complete family.'
						: fontResponse.status === 429
							? 'Fontsource is receiving too many download requests. Wait a moment, then try again.'
							: 'Fontsource could not fetch the selected font file. Try again or download the complete family.';
				throw new Error(responseError);
			}

			setDownloadState('building');
			const archive = zipSync({
				[`${metadata.id}-${downloadAssetFile}`]: new Uint8Array(
					await fontResponse.arrayBuffer(),
				),
				LICENSE: strToU8(registry.license.text),
				'README.txt': strToU8(
					[
						`${metadata.family} from Fontsource`,
						'',
						`Format: ${downloadIsVariable ? 'Variable WOFF2' : 'Desktop TTF'}`,
						`${subsetLabel}: ${subsetValueLabel}`,
						`Style: ${humanize(style)}`,
						...(downloadIsVariable ? [] : [`Weight: ${weight}`]),
						'',
						`Source: https://fontsource.org/fonts/${metadata.id}`,
					].join('\n'),
				),
			});
			triggerBlobDownload(
				downloadArchiveName,
				new Blob([archive], { type: 'application/zip' }),
			);
			setDownloadState('success');
		} catch {
			setDownloadError(
				timedOut
					? 'The download took too long and was stopped. Check your connection, then try again.'
					: (responseError ??
							'The archive could not be built in this browser. Try again or download the complete family.'),
			);
			setDownloadState('error');
		} finally {
			window.clearTimeout(timeout);
			if (downloadController.current === controller) {
				downloadController.current = null;
			}
			downloadInFlight.current = false;
		}
	};

	useEffect(() => {
		const saved = readFontPreviewSelection(metadata.id);
		if (!saved) return;

		setFormat(
			saved.format === 'variable' && supportsVariable ? 'variable' : 'static',
		);
		if (metadata.subsets.includes(saved.subset)) setSubset(saved.subset);
		if (metadata.styles.includes(saved.style)) setStyle(saved.style);
		if (metadata.weights.includes(saved.weight)) setWeight(saved.weight);
		setAxisValues(
			Object.fromEntries(
				Object.entries(variable?.axes ?? {}).map(([axis, range]) => {
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
	}, [metadata, supportsVariable, variable]);

	useEffect(() => {
		if (fromSelectedFonts) setPath('web');
	}, [fromSelectedFonts, setPath]);

	useEffect(
		() => () => {
			downloadController.current?.abort();
		},
		[],
	);

	const projectItem = useMemo(
		() =>
			createProjectItem({
				metadata,
				versions,
				variable,
				registry,
				format: isVariable ? 'variable' : 'static',
				subset,
				style,
				weight,
				axes: axisValues,
			}),
		[
			axisValues,
			isVariable,
			metadata,
			registry,
			style,
			subset,
			variable,
			versions,
			weight,
		],
	);

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
				<p>
					Choose what you are making. We will remember it for the next font.
				</p>
			</div>

			<div className={classes.paths} data-selected={path ?? undefined}>
				<section
					className={classes.path}
					data-open={path === 'download' || undefined}
				>
					<button
						type="button"
						className={classes.pathToggle}
						aria-expanded={path === 'download'}
						aria-controls={path === 'download' ? 'download-setup' : undefined}
						onClick={() => setPath('download')}
					>
						<span>
							<strong>Download font files</strong>
							<small>
								For design apps, documents, desktop use, or custom workflows.
							</small>
						</span>
						<span className={classes.pathAction} aria-hidden="true">
							{path === 'download' ? 'Selected' : 'Customize download'}
						</span>
					</button>

					{path === 'download' && (
						<div className={classes.downloadPanel} id="download-setup">
							<div className={classes.pathLicense}>
								<LicenseReceipt
									familyId={metadata.id}
									family={metadata.family}
									license={registry?.license}
									registryUnavailable={registryUnavailable}
								/>
							</div>
							<fieldset
								className={classes.downloadOptions}
								disabled={isPreparingDownload}
							>
								<legend>Recommended download</legend>
								<div className={classes.downloadOptionsHeading}>
									<p>
										This starts with your Preview choices. Character set, style,
										and weight stay in sync with Website setup. Downloads begin
										with desktop-compatible TTF.
									</p>
									<button type="button" onClick={resetDownload}>
										Reset
									</button>
								</div>

								<div className={classes.downloadFields}>
									<div>
										<label htmlFor="download-format">File format</label>
										<select
											id="download-format"
											aria-describedby="download-format-help"
											value={downloadFormat}
											onChange={(event) => {
												setDownloadFormat(
													event.currentTarget.value as FamilyFormat,
												);
												clearDownloadFeedback();
											}}
										>
											<option value="static">
												Desktop TTF — best for design apps
											</option>
											{supportsVariable && (
												<option value="variable">
													Variable WOFF2 — for websites and compatible tools
												</option>
											)}
										</select>
										<p className={classes.fieldHelp} id="download-format-help">
											{downloadIsVariable
												? 'A browser-focused file that may not install in every desktop design app.'
												: 'Installs in most desktop design apps and works in documents.'}
										</p>
									</div>
									<div>
										<label htmlFor="download-subset">{subsetLabel}</label>
										<select
											id="download-subset"
											value={subset}
											onChange={(event) => {
												setSubset(event.currentTarget.value);
												clearDownloadFeedback();
												setPreviewSettingsApplied(false);
											}}
										>
											{metadata.subsets.map((value) => (
												<option key={value} value={value}>
													{humanize(value)}
												</option>
											))}
										</select>
									</div>
									<div>
										<label htmlFor="download-style">Style</label>
										<select
											id="download-style"
											value={style}
											onChange={(event) => {
												setStyle(
													event.currentTarget
														.value as GetFontResponse['styles'][number],
												);
												clearDownloadFeedback();
												setPreviewSettingsApplied(false);
											}}
										>
											{metadata.styles.map((value) => (
												<option key={value} value={value}>
													{humanize(value)}
												</option>
											))}
										</select>
									</div>
									{!downloadIsVariable && (
										<div>
											<label htmlFor="download-weight">Weight</label>
											<select
												id="download-weight"
												value={weight}
												onChange={(event) => {
													setWeight(Number(event.currentTarget.value));
													clearDownloadFeedback();
													setPreviewSettingsApplied(false);
												}}
											>
												{metadata.weights.map((value) => (
													<option key={value} value={value}>
														{value}
													</option>
												))}
											</select>
										</div>
									)}
								</div>
							</fieldset>

							<aside
								className={classes.downloadSummary}
								aria-busy={isPreparingDownload}
							>
								<span className={classes.summaryLabel}>Your archive</span>
								<strong>{downloadArchiveName}</strong>
								<p>{downloadDescription}</p>
								{hasCatalog && (
									<Link
										className={classes.contextLink}
										to={`/fonts/${metadata.id}/glyphs`}
									>
										Explore symbol names and axes
									</Link>
								)}
								<dl>
									<div>
										<dt>Font file</dt>
										<dd>{downloadAssetFile}</dd>
									</div>
									<div>
										<dt>Also included</dt>
										<dd>License and readme</dd>
									</div>
								</dl>
								<button
									type="button"
									className={classes.primaryButton}
									data-busy={isPreparingDownload || undefined}
									disabled={isPreparingDownload || !hasVerifiedLicenseText}
									onClick={() => void downloadSelectedFiles()}
								>
									<IconDownload aria-hidden height={18} stroke="currentColor" />
									{downloadButtonLabel}
								</button>
								<p
									className={classes.downloadStatus}
									aria-live="polite"
									aria-atomic="true"
								>
									{downloadStatus}
								</p>
								<p className={classes.downloadProvenance}>
									{hasVerifiedLicenseText
										? 'The archive is assembled in your browser from Fontsource font files and the exact license text verified by the registry.'
										: 'A custom archive cannot be built until the registry license text is available. The complete package download remains available below.'}
								</p>
								<a
									className={classes.completeDownload}
									href={`/fonts/${metadata.id}/download`}
									target="_blank"
									rel="noreferrer"
								>
									Download the complete family
									<IconExternal aria-hidden height={15} stroke="currentColor" />
								</a>
							</aside>
						</div>
					)}
				</section>

				<section
					className={classes.path}
					data-open={path === 'web' || undefined}
				>
					<button
						type="button"
						className={classes.pathToggle}
						aria-expanded={path === 'web'}
						aria-controls={path === 'web' ? 'web-setup' : undefined}
						onClick={() => setPath('web')}
					>
						<span>
							<strong>Use on a website</strong>
							<small>
								Self-host with a package, or copy a public CDN link for a quick
								embed.
							</small>
						</span>
						<span className={classes.pathAction} aria-hidden="true">
							{path === 'web' ? 'Selected' : 'View setup'}
						</span>
					</button>

					{path === 'web' && (
						<div className={classes.webPanel} id="web-setup">
							<div className={classes.pathLicense}>
								<LicenseReceipt
									familyId={metadata.id}
									family={metadata.family}
									license={registry?.license}
									registryUnavailable={registryUnavailable}
								/>
							</div>
							<fieldset className={classes.methodSwitch}>
								<legend className={classes.srOnly}>
									Choose how to add this font to a website
								</legend>
								<button
									type="button"
									data-active={method === 'package' || undefined}
									aria-pressed={method === 'package'}
									onClick={() => setMethod('package')}
								>
									<strong>Package</strong>
									<small>Recommended · self-hosted</small>
								</button>
								<button
									type="button"
									data-active={method === 'cdn' || undefined}
									aria-pressed={method === 'cdn'}
									onClick={() => setMethod('cdn')}
								>
									<strong>Quick embed</strong>
									<small>jsDelivr CDN · no install</small>
								</button>
							</fieldset>

							{method === 'cdn' && (
								<p className={classes.deliveryNote}>
									Loads fonts from jsDelivr, a public third-party CDN. Choose
									Package for self-hosting, offline availability, and more
									delivery control.
								</p>
							)}

							<div className={classes.setupGrid}>
								<aside className={classes.summary}>
									<div className={classes.summaryTop}>
										<span>Font settings</span>
										<button
											type="button"
											aria-expanded={advancedOpen}
											aria-controls="advanced-font-setup"
											onClick={() => setAdvancedOpen((open) => !open)}
										>
											{advancedOpen ? 'Hide options' : 'Change options'}
										</button>
									</div>
									<dl>
										<div>
											<dt>Format</dt>
											<dd>{isVariable ? 'Variable' : 'Static'}</dd>
										</div>
										<div>
											<dt>Subset</dt>
											<dd>{subsetValueLabel}</dd>
										</div>
										<div>
											<dt>Style</dt>
											<dd>{humanize(style)}</dd>
										</div>
										<div>
											<dt>Weight</dt>
											<dd>{weight}</dd>
										</div>
									</dl>

									{previewSettingsApplied && (
										<p className={classes.previewHandoff}>
											Using your latest choices from Preview.
										</p>
									)}

									{advancedOpen && (
										<div
											className={classes.advanced}
											id="advanced-font-setup"
											data-format={isVariable ? 'variable' : 'static'}
										>
											<div>
												<label htmlFor="family-format">Format</label>
												<select
													id="family-format"
													value={format}
													onChange={(event) =>
														setFormat(event.currentTarget.value as FamilyFormat)
													}
												>
													{supportsVariable && (
														<option value="variable">Variable</option>
													)}
													<option value="static">Static</option>
												</select>
											</div>
											<div>
												<label htmlFor="font-subset">{subsetLabel}</label>
												<select
													id="font-subset"
													value={subset}
													onChange={(event) => {
														setSubset(event.currentTarget.value);
														setDownloadState('idle');
														setPreviewSettingsApplied(false);
													}}
												>
													{metadata.subsets.map((value) => (
														<option key={value} value={value}>
															{humanize(value)}
														</option>
													))}
												</select>
											</div>
											<div>
												<label htmlFor="font-style">Style</label>
												<select
													id="font-style"
													value={style}
													onChange={(event) => {
														setStyle(
															event.currentTarget
																.value as GetFontResponse['styles'][number],
														);
														setDownloadState('idle');
														setPreviewSettingsApplied(false);
													}}
												>
													{metadata.styles.map((value) => (
														<option key={value} value={value}>
															{humanize(value)}
														</option>
													))}
												</select>
											</div>
											{!isVariable && (
												<div>
													<label htmlFor="font-weight">Weight</label>
													<select
														id="font-weight"
														value={weight}
														onChange={(event) => {
															setWeight(Number(event.currentTarget.value));
															setDownloadState('idle');
															setPreviewSettingsApplied(false);
														}}
													>
														{metadata.weights.map((value) => (
															<option key={value} value={value}>
																{value}
															</option>
														))}
													</select>
												</div>
											)}
											{isVariable &&
												Object.entries(variable?.axes ?? {}).map(
													([axis, range]) => {
														const value =
															axis === 'wght'
																? weight
																: (axisValues[axis] ?? Number(range.default));
														return (
															<label className={classes.axisControl} key={axis}>
																<span>
																	{axisNames[axis] ?? axis.toUpperCase()}
																	<output>{value}</output>
																</span>
																<input
																	type="range"
																	aria-label={`${axisNames[axis] ?? axis} axis`}
																	min={Number(range.min)}
																	max={Number(range.max)}
																	step={Number(range.step)}
																	value={value}
																	onChange={(event) => {
																		const nextValue = Number(
																			event.currentTarget.value,
																		);
																		if (axis === 'wght') {
																			setWeight(nextValue);
																		} else {
																			setAxisValues((values) => ({
																				...values,
																				[axis]: nextValue,
																			}));
																		}
																		setPreviewSettingsApplied(false);
																	}}
																/>
															</label>
														);
													},
												)}
											{!iconUsesMultipleAxes && (
												<label className={classes.optimizationControl}>
													<input
														type="checkbox"
														checked={loadOnlySelection}
														onChange={(event) =>
															setLoadOnlySelection(event.currentTarget.checked)
														}
													/>
													<span>
														<strong>
															Load only this character set and style
														</strong>
														<small>
															Uses a smaller, exact stylesheet instead of the
															package default.
														</small>
													</span>
												</label>
											)}
										</div>
									)}

									{method === 'package' && (
										<div className={classes.manager}>
											<span>Package manager</span>
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
										</div>
									)}
								</aside>

								<div className={classes.instructions}>
									<div className={classes.completeSetup}>
										<div>
											<strong>Complete setup</strong>
											<span>Copy every step below in one action.</span>
										</div>
										<CopyCompleteSetup code={completeSetup} />
									</div>
									{method === 'package' ? (
										<>
											<div>
												<span className={classes.stepLabel}>
													1 · Install the package
												</span>
												<CodeBlock code={installCommand} language="Terminal" />
											</div>
											<div>
												<span className={classes.stepLabel}>
													2 · Import the font stylesheet
												</span>
												<CodeBlock
													code={`import '${importPath}';`}
													language="JavaScript"
												/>
											</div>
										</>
									) : (
										<div>
											<span className={classes.stepLabel}>
												1 · Add the stylesheet link
											</span>
											<CodeBlock
												code={`<link rel="stylesheet" href="${cdnUrl}">`}
												language="HTML"
											/>
										</div>
									)}
									<div>
										<span className={classes.stepLabel}>
											{method === 'package' ? '3' : '2'} · Apply the font in CSS
										</span>
										<CodeBlock code={cssCode} language="CSS" />
									</div>
									{usageMarkup && (
										<div>
											<span className={classes.stepLabel}>
												{method === 'package' ? '4' : '3'} · Add an example to
												your page
											</span>
											<CodeBlock code={usageMarkup} language="HTML" />
										</div>
									)}
									{usageNote && (
										<div className={classes.usageHelp}>
											<p>{usageNote}</p>
											{hasCatalog && (
												<Link to={`/fonts/${metadata.id}/glyphs`}>
													Explore the symbol catalog
												</Link>
											)}
										</div>
									)}
									<div className={classes.renderedCheck}>
										<div>
											<span>Rendered check</span>
											<small>
												This uses your selected family, style, and axes.
											</small>
										</div>
										<strong
											data-special={hasCatalog || isDigitalFamily || undefined}
											style={{
												fontFamily: familyName,
												fontFeatureSettings: hasNamedLigatures
													? '"liga"'
													: undefined,
												fontVariationSettings:
													proofVariationSettings || undefined,
												fontWeight: weight,
												fontStyle: style,
											}}
										>
											{proofText}
										</strong>
									</div>
								</div>
							</div>
							<div className={classes.projectAction}>
								<div>
									<strong>Building with more fonts?</strong>
									<span>
										Save this setup to a Font Set and generate combined code
										when you are ready.
									</span>
								</div>
								<div className={classes.projectActionControls}>
									<ProjectAddButton item={projectItem} />
									<Link to="/selected-fonts">Open font set</Link>
								</div>
							</div>
						</div>
					)}
				</section>
			</div>

			{path === 'web' && (
				<div className={classes.guide}>
					<div>
						<strong>New to web fonts?</strong>
						<span>
							A short guide explains packages, subsets, and self-hosting.
						</span>
					</div>
					<Link to="/docs/getting-started/install">
						Read the guide
						<IconExternal aria-hidden height={16} stroke="currentColor" />
					</Link>
				</div>
			)}
		</section>
	);
};
