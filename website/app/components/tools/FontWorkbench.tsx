import {
	Alert,
	Button,
	Checkbox,
	Code,
	Progress,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
	VisuallyHidden,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBolt, IconPlayerStop, IconTransform } from '@tabler/icons-react';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { CarbonAd } from '@/components/CarbonAd';
import {
	type FontToolPreset,
	useFontWorkbench,
} from '@/hooks/useFontWorkbench';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';
import classes from './FontWorkbench.module.css';
import { FormatSelector } from './FormatSelector';
import { ResultsTable } from './ResultsTable';
import { formatFileSize } from './utils';

const CharacterSelector = lazy(() => import('./CharacterSelector'));

interface FontWorkbenchProps {
	preset: FontToolPreset;
}

const pageContent = {
	converter: {
		title: 'Font Converter',
		description: 'Convert TTF, OTF, WOFF, and WOFF2 files locally.',
		action: 'Convert',
	},
	optimizer: {
		title: 'Webfont Optimizer',
		description:
			'Subset and compress fonts into WOFF2 + CSS. Processed in your browser.',
		action: 'Optimize',
	},
} as const;

const fontDisplayOptions = [
	{ value: 'swap', label: 'swap — show fallback immediately' },
	{ value: 'fallback', label: 'fallback — use fallback if the font is late' },
	{ value: 'optional', label: 'optional — use the font only if ready' },
	{ value: 'block', label: 'block — hide text briefly' },
	{ value: 'auto', label: 'auto — browser default' },
];

const sizeComparison = (inputSize: number, outputSize: number) => {
	const difference = inputSize - outputSize;
	const percentage = (difference / inputSize) * 100;

	if (percentage > 1) {
		return {
			headline: `${Math.round(percentage)}% smaller`,
			detail: `Input ${formatFileSize(inputSize)} → WOFF2 ${formatFileSize(outputSize)} · saved ${formatFileSize(difference)}`,
		};
	}

	if (percentage >= -1) {
		return {
			headline: 'No meaningful size change',
			detail: `Input ${formatFileSize(inputSize)} → WOFF2 ${formatFileSize(outputSize)} · no meaningful change`,
		};
	}

	return {
		headline: 'WOFF2 output is larger',
		detail: `Input ${formatFileSize(inputSize)} → WOFF2 ${formatFileSize(outputSize)} · ${formatFileSize(-difference)} larger`,
	};
};

export const FontWorkbench = ({ preset }: FontWorkbenchProps) => {
	const workbench = useFontWorkbench(preset);
	const showSponsor = useMediaQuery('(min-width: 1201px)');
	const resultsRef = useRef<HTMLElement>(null);
	const wasProcessing = useRef(false);
	const uploadRef = useRef<HTMLDivElement>(null);
	const content = pageContent[preset];
	const readySources = workbench.sources.filter((source) => source.inspection);
	const hasOutputFormat = Object.values(workbench.output.formats).some(Boolean);
	const hasResults = workbench.artifacts.length > 0 && !workbench.isProcessing;
	useEffect(() => {
		if (wasProcessing.current && hasResults) {
			resultsRef.current?.focus({ preventScroll: true });
			resultsRef.current?.scrollIntoView({
				block: 'start',
				behavior: 'instant',
			});
		}
		wasProcessing.current = workbench.isProcessing;
	}, [hasResults, workbench.isProcessing]);
	const failedFamilies = workbench.families.filter(
		(family) => workbench.familyErrors[family.id],
	);
	const failedConversionSources =
		preset === 'converter' ? readySources.filter((source) => source.error) : [];
	const optimizedFamilyIds = new Set(
		workbench.artifacts.flatMap((artifact) =>
			artifact.format !== 'css' && artifact.familyId ? [artifact.familyId] : [],
		),
	);
	const optimizedSourceIds = new Set(
		workbench.families.flatMap((family) =>
			optimizedFamilyIds.has(family.id) ? family.sourceIds : [],
		),
	);
	const optimizedInputSize = readySources
		.filter((source) => optimizedSourceIds.has(source.id))
		.reduce((total, source) => total + source.file.size, 0);
	const optimizedOutputSize = workbench.artifacts
		.filter((artifact) => artifact.format === 'woff2')
		.reduce((total, artifact) => total + artifact.data.byteLength, 0);
	const optimizerSummary =
		preset === 'optimizer' && optimizedInputSize > 0 && optimizedOutputSize > 0
			? sizeComparison(optimizedInputSize, optimizedOutputSize)
			: undefined;
	const convertedSourceCount = new Set(
		workbench.artifacts.flatMap((artifact) =>
			artifact.sourceId === undefined ? [] : [artifact.sourceId],
		),
	).size;
	const resultDescription =
		preset === 'converter'
			? `${workbench.artifacts.length} ${workbench.artifacts.length === 1 ? 'file' : 'files'} from ${convertedSourceCount} ${convertedSourceCount === 1 ? 'font' : 'fonts'}${failedConversionSources.length > 0 ? ` · ${failedConversionSources.length} failed` : ''}`
			: `${workbench.artifacts.length} package ${workbench.artifacts.length === 1 ? 'file' : 'files'} for ${optimizedFamilyIds.size} ${optimizedFamilyIds.size === 1 ? 'family' : 'families'}${failedFamilies.length > 0 ? ` · ${failedFamilies.length} failed` : ''}`;
	const packageDescription = [
		readySources.length > 0
			? `${workbench.families.length} ${workbench.families.length === 1 ? 'family' : 'families'}`
			: undefined,
		'WOFF2',
		workbench.output.formats.woff ? 'WOFF' : undefined,
		workbench.output.includeCss ? 'CSS' : 'font files only',
	]
		.filter(Boolean)
		.join(' · ');
	const outputPath = workbench.output.path.trim().replace(/\/$/, '') || '.';
	const cssUrlPreview = `url('${outputPath}/font-file.woff2')`;
	const actionLabel =
		readySources.length === 0
			? content.action
			: preset === 'converter'
				? `Convert ${readySources.length} ${readySources.length === 1 ? 'font' : 'fonts'}`
				: `Optimize ${workbench.families.length} ${workbench.families.length === 1 ? 'family' : 'families'}`;
	const completionAnnouncement = hasResults
		? [
				preset === 'converter'
					? 'Conversion complete.'
					: 'Optimization complete.',
				optimizerSummary?.headline,
				resultDescription,
			]
				.filter(Boolean)
				.join(' ')
		: '';

	const updateFormat = (
		format: keyof typeof workbench.output.formats,
		checked: boolean,
	) => {
		workbench.updateOutput({
			...workbench.output,
			formats: { ...workbench.output.formats, [format]: checked },
		});
	};

	return (
		<Stack gap="lg">
			<header className={classes.pageHeader}>
				<Stack gap="xs">
					<Title order={1}>{content.title}</Title>
					<Text maw={700} className={classes.supportingText}>
						{content.description}
					</Text>
				</Stack>

				<nav className={classes.modeNav} aria-label="Font tools">
					<Link
						to="/tools/converter"
						className={classes.modeLink}
						data-active={preset === 'converter'}
						data-disabled={
							workbench.isSessionProcessing &&
							workbench.activePreset !== 'converter'
						}
						aria-current={preset === 'converter' ? 'page' : undefined}
						aria-disabled={
							workbench.isSessionProcessing &&
							workbench.activePreset !== 'converter'
						}
						onClick={(event) => {
							if (
								workbench.isSessionProcessing &&
								workbench.activePreset !== 'converter'
							) {
								event.preventDefault();
							}
						}}
					>
						Converter
					</Link>
					<Link
						to="/tools/optimizer"
						className={classes.modeLink}
						data-active={preset === 'optimizer'}
						data-disabled={
							workbench.isSessionProcessing &&
							workbench.activePreset !== 'optimizer'
						}
						aria-current={preset === 'optimizer' ? 'page' : undefined}
						aria-disabled={
							workbench.isSessionProcessing &&
							workbench.activePreset !== 'optimizer'
						}
						onClick={(event) => {
							if (
								workbench.isSessionProcessing &&
								workbench.activePreset !== 'optimizer'
							) {
								event.preventDefault();
							}
						}}
					>
						Optimizer
					</Link>
				</nav>
			</header>

			<VisuallyHidden role="status" aria-atomic="true">
				{completionAnnouncement}
			</VisuallyHidden>

			<FileUpload
				ref={uploadRef}
				onDrop={workbench.addFiles}
				onReject={workbench.rejectFiles}
				disabled={workbench.isSessionProcessing || workbench.isInspecting}
				compact={workbench.sources.length > 0}
			/>

			{workbench.projectNotice && (
				<Text size="sm" role="status" className={classes.supportingText}>
					{workbench.projectNotice}
				</Text>
			)}

			{workbench.projectError && (
				<Alert color="red">{workbench.projectError}</Alert>
			)}

			{workbench.sources.length > 0 && (
				<section
					className={`${classes.section} ${!hasResults ? classes.sourceTableSection : ''}`}
				>
					<FileList
						sources={workbench.sources}
						onRemove={workbench.removeSource}
						onClear={workbench.clearAll}
						onFocusFallback={() => uploadRef.current?.focus()}
						disabled={workbench.isSessionProcessing}
						collapsed={hasResults}
					/>
				</section>
			)}

			<section className={classes.section}>
				{preset === 'converter' ? (
					<div className={classes.converterOptions}>
						<FormatSelector
							formats={workbench.output.formats}
							onChange={updateFormat}
							disabled={workbench.isSessionProcessing}
						/>
						{showSponsor && (
							<CarbonAd
								layout="horizontal"
								slotClassName={classes.converterSponsor}
							/>
						)}
					</div>
				) : (
					<Stack gap="sm">
						<div>
							<Suspense
								fallback={<Text size="sm">Loading character options…</Text>}
							>
								<CharacterSelector
									value={workbench.output.characters}
									error={workbench.characterError}
									disabled={workbench.isSessionProcessing}
									onChange={(characters) =>
										workbench.updateOutput({ ...workbench.output, characters })
									}
								/>
							</Suspense>
							<Text size="sm" mt="md" className={classes.supportingText}>
								Output: {packageDescription}
							</Text>
						</div>

						<details className={classes.advanced}>
							<summary>
								<span>Output settings</span>
							</summary>
							<Stack gap="md" className={classes.advancedContent}>
								<Checkbox
									label="Include WOFF fallback"
									description="For legacy browser support. Increases package size."
									classNames={{ description: classes.supportingText }}
									checked={workbench.output.formats.woff}
									disabled={workbench.isSessionProcessing}
									onChange={({ currentTarget: { checked } }) =>
										updateFormat('woff', checked)
									}
								/>
								<Checkbox
									label="Include CSS"
									description="Creates one index.css per family with @font-face rules."
									classNames={{ description: classes.supportingText }}
									checked={workbench.output.includeCss}
									disabled={workbench.isSessionProcessing}
									onChange={({ currentTarget: { checked } }) =>
										workbench.updateOutput({
											...workbench.output,
											includeCss: checked,
										})
									}
								/>
								{workbench.output.includeCss && (
									<>
										<div className={classes.outputSettings}>
											<Select
												label="font-display"
												data={fontDisplayOptions}
												value={workbench.output.display}
												classNames={{ description: classes.supportingText }}
												disabled={workbench.isSessionProcessing}
												onChange={(value) =>
													workbench.updateOutput({
														...workbench.output,
														display: value ?? 'swap',
													})
												}
											/>
											<TextInput
												label="CSS font path"
												description="Prepended to font URLs in index.css."
												inputWrapperOrder={[
													'label',
													'input',
													'description',
													'error',
												]}
												value={workbench.output.path}
												classNames={{ description: classes.supportingText }}
												disabled={workbench.isSessionProcessing}
												onChange={({ currentTarget: { value } }) =>
													workbench.updateOutput({
														...workbench.output,
														path: value,
													})
												}
											/>
										</div>
										<Text size="xs" className={classes.supportingText}>
											Generated URL:{' '}
											<Code className={classes.pathPreview}>
												{cssUrlPreview}
											</Code>
										</Text>
									</>
								)}
							</Stack>
						</details>
					</Stack>
				)}
			</section>

			<Button
				className={classes.primaryAction}
				variant={hasResults ? 'subtle' : 'filled'}
				size="md"
				leftSection={
					workbench.isProcessing ? (
						<IconPlayerStop size={18} aria-hidden="true" />
					) : preset === 'converter' ? (
						<IconTransform size={18} aria-hidden="true" />
					) : (
						<IconBolt size={18} aria-hidden="true" />
					)
				}
				onClick={
					workbench.isProcessing
						? workbench.stopProcessing
						: workbench.processFiles
				}
				disabled={
					workbench.isStopping ||
					(!workbench.isProcessing &&
						(readySources.length === 0 ||
							workbench.isInspecting ||
							workbench.isSessionProcessing ||
							!hasOutputFormat))
				}
			>
				{workbench.isStopping
					? 'Stopping…'
					: workbench.isProcessing
						? preset === 'optimizer'
							? 'Stop optimization'
							: 'Stop conversion'
						: actionLabel}
			</Button>

			{workbench.isProcessing && (
				<Stack gap={6}>
					<Progress
						value={workbench.progress.value}
						aria-label={workbench.progress.text}
					/>
					<Text size="xs" className={classes.supportingText}>
						{workbench.progress.text}
					</Text>
				</Stack>
			)}

			{failedFamilies.length > 0 && (
				<Alert
					color="red"
					title={`Optimization Failed for ${failedFamilies.length} ${failedFamilies.length === 1 ? 'Family' : 'Families'}`}
				>
					<Stack gap={4}>
						{failedFamilies.map((family) => (
							<Text key={family.id} size="sm">
								{family.name}: {workbench.familyErrors[family.id]}
							</Text>
						))}
					</Stack>
				</Alert>
			)}

			{failedConversionSources.length > 0 && (
				<Alert
					color="red"
					title={`Conversion Failed for ${failedConversionSources.length} ${failedConversionSources.length === 1 ? 'Font' : 'Fonts'}`}
				>
					{failedConversionSources.map((source) => source.file.name).join(', ')}
					. Remove the failed files or try another copy.
				</Alert>
			)}

			{hasResults && (
				<section
					aria-label={
						preset === 'converter'
							? 'Conversion results'
							: 'Optimization results'
					}
					className={classes.results}
					ref={resultsRef}
					tabIndex={-1}
				>
					<div className={classes.section}>
						<ResultsTable
							artifacts={workbench.artifacts}
							title={
								preset === 'converter' ? 'Converted Files' : 'Optimized Files'
							}
							description={resultDescription}
							summary={
								optimizerSummary &&
								`${optimizerSummary.headline} · ${optimizerSummary.detail}`
							}
							zipLabel={
								preset === 'converter' ? 'Download ZIP' : 'Download package'
							}
							onDownload={workbench.downloadArtifact}
							onDownloadAll={workbench.downloadAll}
							isCreatingZip={workbench.isCreatingZip}
						/>
					</div>
				</section>
			)}
		</Stack>
	);
};
