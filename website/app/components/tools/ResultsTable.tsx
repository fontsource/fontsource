import {
	Button,
	Group,
	Stack,
	Table,
	Text,
	Title,
	VisuallyHidden,
} from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import type { FontArtifact } from '@/hooks/useFontWorkbench';
import classes from './FontWorkbench.module.css';
import { formatFileSize } from './utils';

interface ResultsTableProps {
	artifacts: FontArtifact[];
	title: string;
	description: string;
	zipLabel: string;
	onDownload: (artifact: FontArtifact) => void;
	onDownloadAll: () => void;
	isCreatingZip?: boolean;
}

export const ResultsTable = ({
	artifacts,
	title,
	description,
	zipLabel,
	onDownload,
	onDownloadAll,
	isCreatingZip = false,
}: ResultsTableProps) => {
	const [expanded, setExpanded] = useState(false);
	if (artifacts.length === 0) return null;
	const previewLimit = 10;
	const visibleArtifacts = expanded
		? artifacts
		: artifacts.slice(0, previewLimit);
	const hiddenCount = Math.max(0, artifacts.length - previewLimit);

	return (
		<Stack gap="sm">
			<Group justify="space-between" align="flex-start">
				<div>
					<Title order={2} size="h3">
						{title}
					</Title>
					<Text size="sm" mt={4} className={classes.supportingText}>
						{description}
					</Text>
				</div>
				<Button
					leftSection={<IconDownload size={17} aria-hidden="true" />}
					onClick={onDownloadAll}
					loading={isCreatingZip}
				>
					{zipLabel}
				</Button>
			</Group>

			<Table verticalSpacing="sm">
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Filename</Table.Th>
						<Table.Th className={classes.secondaryColumn}>Format</Table.Th>
						<Table.Th className={classes.secondaryColumn}>Size</Table.Th>
						<Table.Th aria-label="Downloads" />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{visibleArtifacts.map((artifact) => (
						<Table.Tr
							key={`${artifact.familyId ?? artifact.sourceId}-${artifact.filename}`}
						>
							<Table.Td className={classes.filenameCell}>
								<Text fw={500}>{artifact.filename}</Text>
								<Text
									size="xs"
									mt={4}
									className={`${classes.mobileMetadata} ${classes.supportingText}`}
								>
									{artifact.format.toUpperCase()} ·{' '}
									{formatFileSize(artifact.data.byteLength)}
								</Text>
							</Table.Td>
							<Table.Td className={classes.secondaryColumn}>
								{artifact.format.toUpperCase()}
							</Table.Td>
							<Table.Td className={classes.secondaryColumn}>
								{formatFileSize(artifact.data.byteLength)}
							</Table.Td>
							<Table.Td ta="right">
								<Button
									variant="subtle"
									size="compact-sm"
									leftSection={<IconDownload size={15} aria-hidden="true" />}
									onClick={() => onDownload(artifact)}
									disabled={isCreatingZip}
								>
									Download
									<VisuallyHidden> {artifact.filename}</VisuallyHidden>
								</Button>
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>

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
