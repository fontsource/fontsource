import { Box, Button, Group, Stack, Table, Text, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

interface BaseFileEntry {
	id: number;
	file: File;
}

interface SuccessFileEntry extends BaseFileEntry {
	font: unknown;
	error?: never;
}

interface ErrorFileEntry extends BaseFileEntry {
	font?: never;
	error: string;
}

type FileEntry = SuccessFileEntry | ErrorFileEntry;

interface FileListProps {
	files: FileEntry[];
	onRemoveFile: (id: number) => void;
	onClearAll: () => void;
	disabled?: boolean;
}

export const FileList = ({
	files,
	onRemoveFile,
	onClearAll,
	disabled = false,
}: FileListProps) => {
	if (files.length === 0) {
		return null;
	}

	return (
		<Stack>
			<Group justify="space-between">
				<Title order={3}>Uploaded Files</Title>
				<Button
					variant="subtle"
					color="red"
					onClick={onClearAll}
					disabled={disabled}
				>
					Clear All
				</Button>
			</Group>
			<Table>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Filename</Table.Th>
						<Table.Th>Size</Table.Th>
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{files.map((fileEntry) => (
						<Table.Tr key={fileEntry.id}>
							<Table.Td>
								{fileEntry.file.name}
								{fileEntry.error && (
									<Text size="xs" c="red" mt={4}>
										{fileEntry.error}
									</Text>
								)}
							</Table.Td>
							<Table.Td>{formatFileSize(fileEntry.file.size)}</Table.Td>
							<Table.Td>
								<Box style={{ textAlign: 'right' }}>
									<Button
										variant="subtle"
										color="red"
										onClick={() => onRemoveFile(fileEntry.id)}
										disabled={disabled}
									>
										<IconX size={16} />
									</Button>
								</Box>
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</Stack>
	);
};

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};
