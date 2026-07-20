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
const sourcePreviewLimit = 4;

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

export const FontWorkbench = ({ preset }: FontWorkbenchProps) => {
	const workbench = useFontWorkbench(preset);
	const [customizeOpen, setCustomizeOpen] = useState(false);
	const [draft, setDraft] = useState<FontOutputSettings>(workbench.output);
	const [expandedFamilyId, setExpandedFamilyId] = useState<string>();
	const content = pageContent[preset];
	const selectedSources = workbench.sources.filter((source) =>
		workbench.selectedFamily?.sourceIds.includes(source.id),
	);
	const selectedArtifacts = workbench.artifacts.filter(
		(artifact) => artifact.familyId === workbench.selectedFamily?.id,
	);
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
	const outputSize = workbench.artifacts.reduce(
		(total, artifact) => total + artifact.data.byteLength,
		0,
	);
	const outputSummary = [
		...outputFormats,
		workbench.output.includeCss ? 'CSS included' : 'No CSS',
		'All characters',
		...(outputSize > 0 ? [formatFileSize(outputSize)] : []),
	].join(' · ');
	const hasDraftFormat = Object.values(draft.formats).some(Boolean);
	const showWorkspace = readyFiles.length > 0 || workbench.isInspecting;
	const showAllSources = expandedFamilyId === workbench.selectedFamily?.id;
	const visibleSources = showAllSources
		? selectedSources
		: selectedSources.slice(0, sourcePreviewLimit);
	const hiddenSourceCount = selectedSources.length - visibleSources.length;

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
				<div className={classes.workbenchShell}>
					<div className={classes.uploadArea}>{fileUpload}</div>
					<div className={classes.workspace}>
						<aside className={classes.families} aria-label="Font families">
							<div className={classes.familyHeader}>
								<Group justify="space-between" align="flex-start">
									<div>
										<Text fw={600}>Families</Text>
										<Text size="xs" c="dimmed">
											{workbench.families.length}{' '}
											{pluralize(
												workbench.families.length,
												'family',
												'families',
											)}{' '}
											· {readyFiles.length}{' '}
											{pluralize(readyFiles.length, 'file')}
										</Text>
									</div>
									<Button
										variant="subtle"
										color="red"
										size="compact-sm"
										onClick={workbench.clearAll}
										disabled={workbench.isProcessing}
									>
										Clear
									</Button>
								</Group>
							</div>
							<div className={classes.familyList}>
								{workbench.families.map((family) => (
									<button
										type="button"
										key={family.id}
										className={classes.familyButton}
										data-active={family.id === workbench.selectedFamily?.id}
										aria-pressed={family.id === workbench.selectedFamily?.id}
										onClick={() => workbench.setSelectedFamilyId(family.id)}
									>
										<Text fw={600} size="sm" lineClamp={1}>
											{family.name}
										</Text>
										<Text size="xs" c="dimmed">
											{family.faces.length}{' '}
											{pluralize(family.faces.length, 'face')}
										</Text>
									</button>
								))}
								{workbench.isInspecting && (
									<Text size="sm" c="dimmed" p="sm">
										Reading font metadata…
									</Text>
								)}
							</div>
						</aside>

						<section className={classes.details}>
							<div className={classes.detailHeader}>
								<Title order={2} size="h3">
									{workbench.selectedFamily?.name ?? 'Reading fonts…'}
								</Title>
								{workbench.selectedFamily && (
									<Text size="sm" c="dimmed">
										{workbench.selectedFamily.faces.some(
											(face) => face.axes.length > 0,
										)
											? 'Variable family · all axes preserved'
											: `${workbench.selectedFamily.faces.length} static ${pluralize(workbench.selectedFamily.faces.length, 'face')}`}
									</Text>
								)}
							</div>

							<div className={classes.fileList}>
								{visibleSources.map((source) => {
									const sourceArtifacts = workbench.artifacts.filter(
										(artifact) => artifact.sourceId === source.id,
									);
									return (
										<div className={classes.fileRow} key={source.id}>
											<Group
												justify="space-between"
												wrap="nowrap"
												align="flex-start"
											>
												<div style={{ minWidth: 0 }}>
													<Text fw={500} className={classes.filename}>
														{source.file.name}
													</Text>
													<Text size="xs" c="dimmed">
														{source.inspection?.subfamilyName} ·{' '}
														{formatFileSize(source.file.size)}
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
																	onClick={() =>
																		workbench.downloadArtifact(artifact)
																	}
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
								})}

								{selectedSources.length > sourcePreviewLimit && (
									<button
										type="button"
										className={classes.fileDisclosure}
										aria-expanded={showAllSources}
										onClick={() =>
											setExpandedFamilyId(
												showAllSources
													? undefined
													: workbench.selectedFamily?.id,
											)
										}
									>
										<span>
											{showAllSources
												? 'Show fewer files'
												: `${hiddenSourceCount} more ${pluralize(hiddenSourceCount, 'file')}`}
										</span>
										{showAllSources ? (
											<IconChevronUp size={18} aria-hidden="true" />
										) : (
											<IconChevronDown size={18} aria-hidden="true" />
										)}
									</button>
								)}

								{workbench.packageOutput && selectedArtifacts.length > 0 && (
									<Stack className={classes.fileRow} gap="sm">
										<Text fw={600}>Generated package</Text>
										<Stack gap={4}>
											{selectedArtifacts.map((artifact) => {
												const filename =
													artifact.filename.split('/').pop() ??
													artifact.filename;
												return (
													<Group key={artifact.filename} gap="xs">
														<Text
															size="sm"
															fw={500}
															className={classes.filename}
															title={filename}
														>
															{filename}
														</Text>
														<Text size="xs" c="dimmed">
															{formatFileSize(artifact.data.byteLength)}
														</Text>
													</Group>
												);
											})}
										</Stack>
									</Stack>
								)}
							</div>
						</section>
					</div>

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
							<Stack gap={2} className={classes.outputSummary}>
								<Text size="sm" fw={600}>
									{workbench.packageOutput ? 'Web package' : 'Output formats'}
								</Text>
								<Text size="xs" c="dimmed">
									{outputSummary}
								</Text>
							</Stack>
							<Group className={classes.outputActions}>
								<Button
									variant="outline"
									color="purple"
									onClick={openCustomize}
									disabled={workbench.isProcessing}
								>
									Customize output
								</Button>
								{workbench.artifacts.length > 0 && !workbench.isProcessing ? (
									<Button
										leftSection={<IconDownload size={17} />}
										onClick={workbench.downloadAll}
										loading={workbench.isCreatingZip}
									>
										Download all
									</Button>
								) : (
									<Button
										onClick={workbench.processFiles}
										loading={workbench.isProcessing}
										disabled={readyFiles.length === 0 || workbench.isInspecting}
									>
										{workbench.packageOutput ? 'Optimize' : 'Convert'}{' '}
										{readyFiles.length} {pluralize(readyFiles.length, 'file')}
									</Button>
								)}
							</Group>
						</Group>
					</div>
				</div>
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
