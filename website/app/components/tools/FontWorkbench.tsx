import {
	Alert,
	Button,
	Checkbox,
	Code,
	Progress,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Title,
	VisuallyHidden,
} from '@mantine/core';
import { IconBolt, IconPlayerStop, IconTransform } from '@tabler/icons-react';
import { useRef } from 'react';
import { Link } from 'react-router';
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

interface FontWorkbenchProps {
	preset: FontToolPreset;
}

const pageContent = {
	converter: {
		title: 'Font Converter',
		description:
			'Convert TTF, OTF, WOFF, and WOFF2 files into the formats you choose.',
		action: 'Convert',
	},
	optimizer: {
		title: 'Webfont Optimizer',
		description: 'Compress font families to WOFF2 and generate matching CSS.',
		action: 'Optimize',
	},
} as const;

const fontDisplayOptions = [
	{ value: 'swap', label: 'Swap — show fallback text immediately' },
	{ value: 'fallback', label: 'Fallback — use fallback if the font is late' },
	{ value: 'optional', label: 'Optional — avoid swapping after text appears' },
	{ value: 'block', label: 'Block — hide text briefly while loading' },
	{ value: 'auto', label: 'Auto — use the browser default' },
];

const sizeComparison = (inputSize: number, outputSize: number) => {
	const difference = inputSize - outputSize;
	const percentage = (difference / inputSize) * 100;

	if (percentage > 1) {
		return {
			headline: `${Math.round(percentage)}% smaller as WOFF2`,
			detail: `Original ${formatFileSize(inputSize)} → WOFF2 ${formatFileSize(outputSize)} · Saved ${formatFileSize(difference)}`,
			tone: 'success',
		};
	}

	if (percentage >= -1) {
		return {
			headline: 'Already optimized as WOFF2',
			detail: `Original ${formatFileSize(inputSize)} → WOFF2 ${formatFileSize(outputSize)} · No meaningful size change`,
			tone: 'info',
		};
	}

	return {
		headline: 'WOFF2 is larger for this font',
		detail: `Original ${formatFileSize(inputSize)} → WOFF2 ${formatFileSize(outputSize)} · Generated output is ${formatFileSize(-difference)} larger`,
		tone: 'warning',
	};
};

export const FontWorkbench = ({ preset }: FontWorkbenchProps) => {
	const workbench = useFontWorkbench(preset);
	const uploadRef = useRef<HTMLDivElement>(null);
	const content = pageContent[preset];
	const readySources = workbench.sources.filter((source) => source.inspection);
	const hasOutputFormat = Object.values(workbench.output.formats).some(Boolean);
	const hasResults = workbench.artifacts.length > 0 && !workbench.isProcessing;
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
			? `${convertedSourceCount}${failedConversionSources.length > 0 ? ` of ${readySources.length}` : ''} ${convertedSourceCount === 1 ? 'font' : 'fonts'} converted into ${workbench.artifacts.length} downloadable ${workbench.artifacts.length === 1 ? 'file' : 'files'}.${failedConversionSources.length > 0 ? ` ${failedConversionSources.length} failed.` : ''}`
			: `${optimizedFamilyIds.size}${failedFamilies.length > 0 ? ` of ${workbench.families.length}` : ''} ${optimizedFamilyIds.size === 1 ? 'family' : 'families'} packaged into ${workbench.artifacts.length} downloadable ${workbench.artifacts.length === 1 ? 'file' : 'files'}.${failedFamilies.length > 0 ? ` ${failedFamilies.length} failed.` : ''}`;
	const packageDescription = [
		readySources.length > 0
			? `${workbench.families.length} ${workbench.families.length === 1 ? 'family' : 'families'}`
			: undefined,
		'WOFF2',
		workbench.output.formats.woff ? 'WOFF fallback' : undefined,
		workbench.output.includeCss ? 'CSS included' : 'font files only',
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
						{content.description} Your files stay on this device.
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
					<FormatSelector
						formats={workbench.output.formats}
						onChange={updateFormat}
						disabled={workbench.isSessionProcessing}
					/>
				) : (
					<Stack gap="sm">
						<div>
							<Title order={2} size="h3">
								Package contents
							</Title>
							<Text size="sm" mt={4} className={classes.supportingText}>
								{packageDescription}
							</Text>
						</div>

						<details className={classes.advanced}>
							<summary>Advanced options</summary>
							<Stack gap="md" className={classes.advancedContent}>
								<Checkbox
									label="Add WOFF fallback"
									description="Adds WOFF files for older browsers. The package will be larger."
									classNames={{ description: classes.supportingText }}
									checked={workbench.output.formats.woff}
									disabled={workbench.isSessionProcessing}
									onChange={({ currentTarget: { checked } }) =>
										updateFormat('woff', checked)
									}
								/>
								<Checkbox
									label="Include CSS"
									description="Creates an index.css file with @font-face rules for each family."
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
										<SimpleGrid cols={{ base: 1, sm: 2 }}>
											<Select
												label="Text loading behavior"
												description="Controls what appears while the font loads."
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
												label="Font asset path"
												description="Added before each font filename in generated CSS URLs."
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
										</SimpleGrid>
										<Text size="xs" className={classes.supportingText}>
											CSS URL preview:{' '}
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
				<Alert color="red" title="Some font families were not optimized">
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
					title={`${failedConversionSources.length} ${failedConversionSources.length === 1 ? 'font was' : 'fonts were'} not converted`}
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
				>
					{optimizerSummary && (
						<div
							className={classes.resultSummary}
							data-tone={optimizerSummary.tone}
						>
							<Title order={2} size="h3" className={classes.resultTitle}>
								{optimizerSummary.headline}
							</Title>
							<Text size="sm" mt={4} className={classes.resultDetail}>
								{optimizerSummary.detail}
							</Text>
						</div>
					)}

					<div className={classes.section}>
						<ResultsTable
							artifacts={workbench.artifacts}
							title={
								preset === 'converter' ? 'Converted files' : 'Package files'
							}
							description={resultDescription}
							zipLabel={
								preset === 'converter'
									? 'Download all as ZIP'
									: 'Download package'
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
