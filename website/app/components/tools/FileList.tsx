import {
	ActionIcon,
	Button,
	Group,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import type { FontSourceEntry } from '@/hooks/useFontWorkbench';
import classes from './FontWorkbench.module.css';
import { formatFileSize } from './utils';

interface FileListProps {
	sources: FontSourceEntry[];
	onRemove: (id: number) => void;
	onClear: () => void;
	onFocusFallback: () => void;
	disabled?: boolean;
	collapsed?: boolean;
}

const SOURCE_PREVIEW_LIMIT = 5;

const sourceFormat = (filename: string): string =>
	(filename.split('.').pop() ?? 'Unknown').toUpperCase();

const sourceIdentity = (source: FontSourceEntry): string | undefined => {
	const face = source.inspection;
	if (!face) return undefined;

	if (face.axes.length > 0) {
		const variableRange =
			typeof face.weight === 'number'
				? ''
				: ` ${face.weight.min}–${face.weight.max}`;
		return `${face.familyName} · Variable${variableRange}`;
	}

	const faceName = face.subfamilyName || face.style;
	return `${face.familyName} · ${faceName} ${face.weight}`;
};

interface SourceTableProps {
	sources: FontSourceEntry[];
	duplicateFilenameLabels: ReadonlyMap<number, string>;
	onRemove: (id: number) => void;
	disabled: boolean;
}

const buildDuplicateFilenameLabels = (
	sources: FontSourceEntry[],
): ReadonlyMap<number, string> => {
	const groups = new Map<string, FontSourceEntry[]>();
	for (const source of sources) {
		const filename = source.file.name.normalize('NFC').toLowerCase();
		const group = groups.get(filename) ?? [];
		group.push(source);
		groups.set(filename, group);
	}

	const labels = new Map<number, string>();
	for (const group of groups.values()) {
		if (group.length < 2) continue;
		for (const [index, source] of group.entries()) {
			labels.set(source.id, `, duplicate ${index + 1} of ${group.length}`);
		}
	}
	return labels;
};

const SourceTable = ({
	sources,
	duplicateFilenameLabels,
	onRemove,
	disabled,
}: SourceTableProps) => (
	<Table verticalSpacing="sm">
		<Table.Thead>
			<Table.Tr>
				<Table.Th>Filename</Table.Th>
				<Table.Th className={classes.secondaryColumn}>Format</Table.Th>
				<Table.Th className={classes.secondaryColumn}>Size</Table.Th>
				<Table.Th aria-label="Actions" />
			</Table.Tr>
		</Table.Thead>
		<Table.Tbody>
			{sources.map((source) => {
				const identity = sourceIdentity(source);

				return (
					<Table.Tr key={source.id}>
						<Table.Td className={classes.filenameCell}>
							<Text fw={500}>{source.file.name}</Text>
							{identity && (
								<Text size="xs" mt={4} className={classes.supportingText}>
									{identity}
								</Text>
							)}
							<Text
								size="xs"
								mt={4}
								className={`${classes.mobileMetadata} ${classes.supportingText}`}
							>
								{sourceFormat(source.file.name)} ·{' '}
								{formatFileSize(source.file.size)}
							</Text>
							{source.error && (
								<Text size="xs" c="red" mt={4}>
									{source.error}
								</Text>
							)}
							{!source.inspection && !source.error && (
								<Text size="xs" mt={4} className={classes.supportingText}>
									Reading metadata…
								</Text>
							)}
						</Table.Td>
						<Table.Td className={classes.secondaryColumn}>
							{sourceFormat(source.file.name)}
						</Table.Td>
						<Table.Td className={classes.secondaryColumn}>
							{formatFileSize(source.file.size)}
						</Table.Td>
						<Table.Td ta="right">
							<ActionIcon
								variant="subtle"
								color="red"
								aria-label={`Remove ${source.file.name}${duplicateFilenameLabels.get(source.id) ?? ''}`}
								onClick={() => onRemove(source.id)}
								disabled={disabled}
							>
								<IconX size={16} aria-hidden="true" />
							</ActionIcon>
						</Table.Td>
					</Table.Tr>
				);
			})}
		</Table.Tbody>
	</Table>
);

export const FileList = ({
	sources,
	onRemove,
	onClear,
	onFocusFallback,
	disabled = false,
	collapsed = false,
}: FileListProps) => {
	const titleRef = useRef<HTMLHeadingElement>(null);
	const [expanded, setExpanded] = useState(false);
	if (sources.length === 0) return null;

	const totalSize = sources.reduce(
		(total, source) => total + source.file.size,
		0,
	);
	const batchSummary = `${sources.length} ${sources.length === 1 ? 'file' : 'files'} · ${formatFileSize(totalSize)}`;
	const readableCount = sources.filter((source) => source.inspection).length;
	const unreadableCount = sources.filter(
		(source) => !source.inspection && source.error,
	).length;
	const readingCount = sources.length - readableCount - unreadableCount;
	const inspectionSummary =
		readingCount > 0 || unreadableCount > 0
			? [
					readableCount > 0 ? `${readableCount} ready` : undefined,
					readingCount > 0
						? `Reading ${readingCount} ${readingCount === 1 ? 'file' : 'files'}…`
						: undefined,
					unreadableCount > 0 ? `${unreadableCount} unreadable` : undefined,
				]
					.filter(Boolean)
					.join(' · ')
			: undefined;
	const inspectionState = unreadableCount > 0 ? 'warning' : 'reading';
	const fullBatchSummary = inspectionSummary ? (
		<>
			{batchSummary} ·{' '}
			<span className={classes.batchStatus} data-state={inspectionState}>
				{inspectionSummary}
			</span>
		</>
	) : (
		batchSummary
	);
	const visibleSources = expanded
		? sources
		: sources.slice(0, SOURCE_PREVIEW_LIMIT);
	const hiddenCount = Math.max(0, sources.length - SOURCE_PREVIEW_LIMIT);
	const duplicateLabels = buildDuplicateFilenameLabels(sources);
	const restoreFocus = (hasRemainingSources: boolean) => {
		requestAnimationFrame(() => {
			if (hasRemainingSources) {
				titleRef.current?.focus();
			} else {
				onFocusFallback();
			}
		});
	};
	const removeSource = (id: number) => {
		onRemove(id);
		restoreFocus(sources.some((source) => source.id !== id));
	};
	const clearSources = () => {
		onClear();
		restoreFocus(false);
	};

	if (collapsed) {
		return (
			<details className={classes.sourceDetails}>
				<summary>
					<span className={classes.sourceDetailsTitle}>Font Files</span>
					<span className={classes.supportingText}>{fullBatchSummary}</span>
				</summary>
				<Stack gap="sm" className={classes.sourceDetailsContent}>
					<Group justify="flex-end">
						<Button
							variant="subtle"
							color="red"
							onClick={clearSources}
							disabled={disabled}
						>
							Remove all files
						</Button>
					</Group>
					<SourceTable
						sources={visibleSources}
						duplicateFilenameLabels={duplicateLabels}
						onRemove={removeSource}
						disabled={disabled}
					/>
					{hiddenCount > 0 && (
						<Button
							variant="subtle"
							size="compact-sm"
							className={classes.showMore}
							onClick={() => setExpanded((current) => !current)}
						>
							{expanded
								? 'Show fewer files'
								: `Show ${hiddenCount} more ${hiddenCount === 1 ? 'file' : 'files'}`}
						</Button>
					)}
				</Stack>
			</details>
		);
	}

	return (
		<Stack gap="sm">
			<Group justify="space-between">
				<div>
					<Title
						ref={titleRef}
						order={2}
						size="h3"
						tabIndex={-1}
						className={classes.fileListTitle}
					>
						Font Files
					</Title>
					<Text size="sm" mt={4} className={classes.supportingText}>
						{fullBatchSummary}
					</Text>
				</div>
				<Button
					variant="subtle"
					color="red"
					onClick={clearSources}
					disabled={disabled}
				>
					Remove all files
				</Button>
			</Group>

			<SourceTable
				sources={visibleSources}
				duplicateFilenameLabels={duplicateLabels}
				onRemove={removeSource}
				disabled={disabled}
			/>
			{hiddenCount > 0 && (
				<Button
					variant="subtle"
					size="compact-sm"
					className={classes.showMore}
					onClick={() => setExpanded((current) => !current)}
				>
					{expanded
						? 'Show fewer files'
						: `Show ${hiddenCount} more ${hiddenCount === 1 ? 'file' : 'files'}`}
				</Button>
			)}
		</Stack>
	);
};
