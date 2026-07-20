import {
	ActionIcon,
	Alert,
	Button,
	Checkbox,
	Divider,
	Group,
	Modal,
	Progress,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import {
	IconChevronDown,
	IconChevronUp,
	IconDownload,
	IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router';
import {
	type FontToolPreset,
	useFontWorkbench,
} from '@/hooks/useFontWorkbench';
import { FileUpload } from './FileUpload';
import classes from './FontWorkbench.module.css';
import { formatFileSize } from './utils';

interface FontWorkbenchProps {
	preset: FontToolPreset;
}

type FontOutputSettings = ReturnType<typeof useFontWorkbench>['output'];

const outputFormatOrder = ['woff2', 'woff', 'ttf'] as const;
const sourcePreviewLimit = 5;

const pageContent = {
	converter: {
		title: 'Font Converter',
		description:
			'Convert TTF, OTF, WOFF, and WOFF2 files directly in your browser. Your fonts never leave your device.',
	},
	optimizer: {
		title: 'Webfont Optimizer',
		description:
			'Create compressed WOFF2 webfonts and ready-to-use CSS without uploading your font files.',
	},
} as const;

const pluralize = (
	count: number,
	singular: string,
	plural = `${singular}s`,
): string => (count === 1 ? singular : plural);

const sourceFormat = (filename: string): string =>
	(filename.split('.').pop() ?? 'font').toUpperCase();

const sizeComparison = (inputSize: number, outputSize: number) => {
	const difference = inputSize - outputSize;
	const percentage = (difference / inputSize) * 100;

	if (percentage > 1) {
		return {
			headline: `${Math.round(percentage)}% smaller`,
			detail: `${formatFileSize(inputSize)} → ${formatFileSize(outputSize)} · Saved ${formatFileSize(difference)}`,
		};
	}

	if (percentage >= -1) {
		return {
			headline: 'Already compact',
			detail: `${formatFileSize(inputSize)} → ${formatFileSize(outputSize)} · No meaningful size change`,
		};
	}

	return {
		headline: 'Original is smaller',
		detail: `${formatFileSize(inputSize)} → ${formatFileSize(outputSize)} · Generated output is ${formatFileSize(-difference)} larger`,
	};
};

export const FontWorkbench = ({ preset }: FontWorkbenchProps) => {
	const workbench = useFontWorkbench(preset);
	const [customizeOpen, setCustomizeOpen] = useState(false);
	const [draft, setDraft] = useState<FontOutputSettings>(workbench.output);
	const [expandedSourceGroupId, setExpandedSourceGroupId] = useState<string>();
	const [showAllFamilies, setShowAllFamilies] = useState(false);
	const content = pageContent[preset];
	const outputFormats = outputFormatOrder
		.filter((format) => workbench.output.formats[format])
		.map((format) => format.toUpperCase());
	const readyFiles = workbench.sources.filter((source) => source.inspection);
	const invalidSources = workbench.sources.filter(
		(source) => !source.inspection && source.error,
	);
	const failedSources = workbench.sources.filter(
		(source) => source.inspection && source.error,
	);
	const failedFamilies = workbench.families.filter(
		(family) => workbench.familyErrors[family.id],
	);
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
	const optimizedInputSize = readyFiles
		.filter((source) => optimizedSourceIds.has(source.id))
		.reduce((total, source) => total + source.file.size, 0);
	const comparisonFormat = workbench.output.formats.woff2
		? 'woff2'
		: workbench.output.formats.woff
			? 'woff'
			: undefined;
	const optimizedOutputSize = comparisonFormat
		? workbench.artifacts
				.filter((artifact) => artifact.format === comparisonFormat)
				.reduce((total, artifact) => total + artifact.data.byteLength, 0)
		: 0;
	const optimizerSummary =
		preset === 'optimizer' &&
		workbench.packageOutput &&
		optimizedInputSize > 0 &&
		optimizedOutputSize > 0
			? sizeComparison(optimizedInputSize, optimizedOutputSize)
			: undefined;
	const outputSettings = [
		outputFormats.join(' + '),
		workbench.output.includeCss ? 'CSS' : undefined,
		workbench.output.preserveNames ? 'Original names' : undefined,
	]
		.filter(Boolean)
		.join(' · ');
	const hasDraftFormat = Object.values(draft.formats).some(Boolean);
	const showWorkspace = readyFiles.length > 0 || workbench.isInspecting;
	const hasResults = workbench.artifacts.length > 0 && !workbench.isProcessing;
	const visibleFamilies = showAllFamilies
		? workbench.families
		: workbench.families.slice(0, sourcePreviewLimit);

	const openCustomize = () => {
		setDraft(workbench.output);
		setCustomizeOpen(true);
	};

	const packageDraft = draft.includeCss || !draft.preserveNames;
	const fileUpload = (
		<FileUpload
			onDrop={workbench.addFiles}
			onReject={workbench.rejectFiles}
			disabled={workbench.isProcessing || workbench.isInspecting}
			compact={workbench.sources.length > 0}
		/>
	);

	const renderDisclosure = (groupId: string, totalCount: number) => {
		if (totalCount <= sourcePreviewLimit) return null;

		const expanded = expandedSourceGroupId === groupId;
		const hiddenCount = totalCount - sourcePreviewLimit;
		return (
			<button
				type="button"
				className={classes.fileDisclosure}
				aria-expanded={expanded}
				onClick={() => setExpandedSourceGroupId(expanded ? undefined : groupId)}
			>
				<span>
					{expanded
						? 'Show fewer files'
						: `Show ${hiddenCount} more ${pluralize(hiddenCount, 'file')}`}
				</span>
				{expanded ? (
					<IconChevronUp size={18} aria-hidden="true" />
				) : (
					<IconChevronDown size={18} aria-hidden="true" />
				)}
			</button>
		);
	};

	const renderSourceRow = (source: (typeof workbench.sources)[number]) => {
		const sourceArtifacts = workbench.artifacts.filter(
			(artifact) => artifact.sourceId === source.id,
		);
		const metadata = [
			preset === 'converter' ? source.inspection?.familyName : undefined,
			source.inspection?.subfamilyName,
			sourceFormat(source.file.name),
			formatFileSize(source.file.size),
		]
			.filter(Boolean)
			.join(' · ');

		return (
			<div className={classes.fileRow} key={source.id}>
				<Group justify="space-between" wrap="nowrap" align="flex-start">
					<div style={{ minWidth: 0 }}>
						<Text fw={500} className={classes.filename}>
							{source.file.name}
						</Text>
						<Text size="xs" c="dimmed">
							{metadata}
						</Text>
						{sourceArtifacts.length > 0 && (
							<Group gap="xs" mt="xs">
								{sourceArtifacts.map((artifact) => (
									<Button
										key={artifact.filename}
										variant="light"
										size="compact-xs"
										c="var(--mantine-color-text)"
										leftSection={<IconDownload size={13} />}
										onClick={() => workbench.downloadArtifact(artifact)}
									>
										{artifact.format.toUpperCase()} ·{' '}
										{formatFileSize(artifact.data.byteLength)}
									</Button>
								))}
							</Group>
						)}
					</div>
					<ActionIcon
						variant="subtle"
						color="red"
						aria-label={`Remove ${source.file.name}`}
						onClick={() => workbench.removeSource(source.id)}
						disabled={workbench.isProcessing}
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
			</div>
		);
	};

	return (
		<Stack gap="xl">
			<div className={classes.pageHeader}>
				<Stack gap="xs">
					<Title order={1}>{content.title}</Title>
					<Text c="dimmed" maw={760}>
						{content.description}
					</Text>
				</Stack>
				<nav className={classes.modeNav} aria-label="Font tool mode">
					<Link
						to="/tools/converter"
						className={classes.modeLink}
						data-active={preset === 'converter'}
						aria-current={preset === 'converter' ? 'page' : undefined}
					>
						Converter
					</Link>
					<Link
						to="/tools/optimizer"
						className={classes.modeLink}
						data-active={preset === 'optimizer'}
						aria-current={preset === 'optimizer' ? 'page' : undefined}
					>
						Optimizer
					</Link>
				</nav>
			</div>

			{!showWorkspace && fileUpload}

			{workbench.projectError && (
				<Alert color="red" title="Unable to continue">
					{workbench.projectError}
				</Alert>
			)}
			{invalidSources.length > 0 && (
				<Alert
					color="red"
					title={`${invalidSources.length} ${pluralize(invalidSources.length, 'file')} could not be read`}
					styles={{ body: { minWidth: 0 } }}
				>
					<Stack gap="xs" className={classes.errorList}>
						{invalidSources.map((source) => (
							<Group
								key={source.id}
								justify="space-between"
								wrap="nowrap"
								align="flex-start"
								miw={0}
							>
								<Text
									size="sm"
									fw={500}
									truncate="start"
									style={{ minWidth: 0, flex: 1 }}
								>
									{source.file.name}
								</Text>
								<Button
									variant="subtle"
									color="red"
									size="compact-xs"
									style={{ flexShrink: 0 }}
									aria-label={`Remove ${source.file.name}`}
									onClick={() => workbench.removeSource(source.id)}
								>
									Remove
								</Button>
							</Group>
						))}
					</Stack>
				</Alert>
			)}
			{failedSources.length > 0 && (
				<Alert
					color="red"
					title={`${failedSources.length} ${pluralize(failedSources.length, 'file')} could not be converted`}
				>
					<Stack gap={4} className={classes.errorList}>
						{failedSources.map((source) => (
							<Text key={source.id} size="sm">
								{source.file.name}: {source.error}
							</Text>
						))}
					</Stack>
				</Alert>
			)}
			{failedFamilies.length > 0 && (
				<Alert
					color="red"
					title={`${failedFamilies.length} ${pluralize(failedFamilies.length, 'family', 'families')} could not be optimized`}
				>
					<Stack gap={4} className={classes.errorList}>
						{failedFamilies.map((family) => (
							<Text key={family.id} size="sm">
								{family.name}: {workbench.familyErrors[family.id]}
							</Text>
						))}
					</Stack>
				</Alert>
			)}

			{showWorkspace && (
				<Stack gap="md">
					<div className={classes.projectHeader}>
						<div className={classes.compactUpload}>{fileUpload}</div>
						<Button
							variant="subtle"
							color="red"
							size="compact-sm"
							onClick={workbench.clearAll}
							disabled={workbench.isProcessing}
						>
							Clear all
						</Button>
					</div>

					<div className={classes.workbenchShell}>
						{optimizerSummary && comparisonFormat && (
							<div
								className={classes.resultSummary}
								role="status"
								aria-live="polite"
								aria-atomic="true"
							>
								<Text fw={700} className={classes.resultValue}>
									{optimizerSummary.headline}
								</Text>
								<Text size="sm" c="dimmed">
									{comparisonFormat.toUpperCase()} · {optimizerSummary.detail}
								</Text>
							</div>
						)}

						{preset === 'converter' ? (
							<section aria-labelledby="converter-files-heading">
								<div className={classes.sectionHeader}>
									<div>
										<Title id="converter-files-heading" order={2} size="h4">
											Uploaded fonts
										</Title>
										<Text size="sm" c="dimmed">
											Converted files appear beneath each source.
										</Text>
									</div>
									{hasResults && (
										<Text size="sm" fw={600} c="purple.0" role="status">
											{workbench.artifacts.length}{' '}
											{pluralize(workbench.artifacts.length, 'output')} ready
										</Text>
									)}
								</div>
								<div className={classes.fileList}>
									{(expandedSourceGroupId === 'converter'
										? readyFiles
										: readyFiles.slice(0, sourcePreviewLimit)
									).map(renderSourceRow)}
									{workbench.isInspecting && (
										<Text size="sm" c="dimmed" py="md">
											Reading font metadata…
										</Text>
									)}
									{renderDisclosure('converter', readyFiles.length)}
								</div>
							</section>
						) : (
							<div>
								{visibleFamilies.map((family) => {
									const familySources = readyFiles.filter((source) =>
										family.sourceIds.includes(source.id),
									);
									const familyArtifacts = workbench.artifacts.filter(
										(artifact) => artifact.familyId === family.id,
									);
									const expanded = expandedSourceGroupId === family.id;
									const visibleSources = expanded
										? familySources
										: familySources.slice(0, sourcePreviewLimit);
									const isVariable = family.faces.some(
										(face) => face.axes.length > 0,
									);
									const familyInputSize = familySources.reduce(
										(total, source) => total + source.file.size,
										0,
									);
									const familyHeadingId = `family-${family.id}`;

									return (
										<section
											className={classes.familySection}
											key={family.id}
											aria-labelledby={familyHeadingId}
										>
											<div className={classes.familyHeader}>
												<div>
													<Title id={familyHeadingId} order={2} size="h4">
														{family.name}
													</Title>
													<Text size="sm" c="dimmed">
														{familySources.length}{' '}
														{pluralize(familySources.length, 'file')} ·{' '}
														{isVariable
															? 'Variable, all axes preserved'
															: `${family.faces.length} static ${pluralize(family.faces.length, 'face')}`}{' '}
														· {formatFileSize(familyInputSize)}
													</Text>
												</div>
												{familyArtifacts.length > 0 && (
													<Text size="sm" fw={600} c="purple.0">
														Ready
													</Text>
												)}
											</div>
											<div className={classes.fileList}>
												{visibleSources.map(renderSourceRow)}
												{renderDisclosure(family.id, familySources.length)}
											</div>
											{familyArtifacts.length > 0 && (
												<details className={classes.packageDetails}>
													<summary>Package contents</summary>
													<Stack
														gap={4}
														mt="sm"
														className={classes.packageList}
													>
														{familyArtifacts.map((artifact) => (
															<Group
																key={artifact.filename}
																justify="space-between"
																gap="md"
																wrap="nowrap"
															>
																<Text size="sm" className={classes.filename}>
																	{artifact.filename.split('/').pop() ??
																		artifact.filename}
																</Text>
																<Text size="xs" c="dimmed">
																	{formatFileSize(artifact.data.byteLength)}
																</Text>
															</Group>
														))}
													</Stack>
												</details>
											)}
										</section>
									);
								})}
								{workbench.families.length > sourcePreviewLimit && (
									<div className={classes.fileList}>
										<button
											type="button"
											className={classes.fileDisclosure}
											aria-expanded={showAllFamilies}
											onClick={() => setShowAllFamilies((current) => !current)}
										>
											<span>
												{showAllFamilies
													? 'Show fewer families'
													: `Show ${workbench.families.length - sourcePreviewLimit} more ${pluralize(workbench.families.length - sourcePreviewLimit, 'family', 'families')}`}
											</span>
											{showAllFamilies ? (
												<IconChevronUp size={18} aria-hidden="true" />
											) : (
												<IconChevronDown size={18} aria-hidden="true" />
											)}
										</button>
									</div>
								)}
								{workbench.isInspecting && (
									<Text size="sm" c="dimmed" p="lg">
										Reading font metadata…
									</Text>
								)}
							</div>
						)}

						{workbench.isProcessing && (
							<Stack gap={6} className={classes.progressArea}>
								<Progress
									value={workbench.progress.value}
									aria-label={workbench.progress.text}
								/>
								<Text size="xs" c="dimmed" role="status" aria-atomic="true">
									{workbench.progress.text}
								</Text>
							</Stack>
						)}

						<div className={classes.outputBar}>
							<Group
								justify="space-between"
								align="center"
								className={classes.outputLayout}
							>
								<Stack gap={2} className={classes.settingsSummary}>
									<Text size="xs" c="dimmed">
										Output
									</Text>
									<Group gap="xs">
										<Text size="sm" fw={600}>
											{outputSettings}
										</Text>
										<Button
											variant="subtle"
											size="compact-xs"
											onClick={openCustomize}
											disabled={workbench.isProcessing}
										>
											Change
										</Button>
									</Group>
								</Stack>
								<Group className={classes.outputActions}>
									{hasResults ? (
										<Button
											leftSection={<IconDownload size={17} />}
											onClick={workbench.downloadAll}
											loading={workbench.isCreatingZip}
										>
											{workbench.packageOutput
												? 'Download package'
												: 'Download all'}
										</Button>
									) : (
										<Button
											onClick={workbench.processFiles}
											loading={workbench.isProcessing}
											disabled={
												readyFiles.length === 0 || workbench.isInspecting
											}
										>
											{workbench.packageOutput ? 'Optimize' : 'Convert'}{' '}
											{readyFiles.length} {pluralize(readyFiles.length, 'file')}
										</Button>
									)}
								</Group>
							</Group>
						</div>
					</div>
				</Stack>
			)}

			<Modal
				opened={customizeOpen}
				onClose={() => setCustomizeOpen(false)}
				title="Customize output"
				closeButtonProps={{ 'aria-label': 'Close customize output' }}
				size="lg"
				centered
			>
				<Stack className={classes.customizeContent}>
					<Stack gap="xs">
						<Text fw={600}>Output formats</Text>
						<Group>
							{outputFormatOrder.map((format) => (
								<Checkbox
									key={format}
									label={format.toUpperCase()}
									checked={draft.formats[format]}
									disabled={format === 'ttf' && packageDraft}
									onChange={({ currentTarget: { checked } }) =>
										setDraft((current) => ({
											...current,
											formats: {
												...current.formats,
												[format]: checked,
											},
										}))
									}
								/>
							))}
						</Group>
						{!hasDraftFormat && (
							<Text size="xs" c="red" role="alert">
								Select at least one output format.
							</Text>
						)}
						{packageDraft && (
							<Text size="xs" c="dimmed">
								TTF requires CSS off and original filenames.
							</Text>
						)}
					</Stack>

					<Divider />
					<Checkbox
						label="Include ready-to-use CSS"
						description="Creates one index.css file for each family."
						checked={draft.includeCss}
						onChange={({ currentTarget: { checked } }) =>
							setDraft((current) => ({
								...current,
								includeCss: checked,
								preserveNames: checked ? false : current.preserveNames,
								formats: checked
									? { ...current.formats, ttf: false }
									: current.formats,
							}))
						}
					/>
					{draft.includeCss && (
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<Select
								label="font-display"
								data={['swap', 'fallback', 'optional', 'block', 'auto']}
								value={draft.display}
								onChange={(value) =>
									setDraft((current) => ({
										...current,
										display: value ?? 'swap',
									}))
								}
							/>
							<TextInput
								label="Font file path"
								value={draft.path}
								onChange={({ currentTarget: { value } }) =>
									setDraft((current) => ({
										...current,
										path: value,
									}))
								}
							/>
						</SimpleGrid>
					)}

					{!draft.includeCss && (
						<Checkbox
							label="Keep original filenames"
							checked={draft.preserveNames}
							onChange={({ currentTarget: { checked } }) =>
								setDraft((current) => ({
									...current,
									preserveNames: checked,
									formats: checked
										? current.formats
										: { ...current.formats, ttf: false },
								}))
							}
						/>
					)}

					<Group justify="flex-end">
						<Button variant="default" onClick={() => setCustomizeOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={!hasDraftFormat}
							onClick={() => {
								workbench.updateOutput(draft);
								setCustomizeOpen(false);
							}}
						>
							Apply settings
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
};
