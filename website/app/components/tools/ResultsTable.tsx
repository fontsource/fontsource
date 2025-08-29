import { ActionIcon, Button, Stack, Table, Text, Title } from '@mantine/core';
import { IconFileDownload } from '@tabler/icons-react';
import { formatFileSize } from './utils';

interface ConversionResult {
	name: string;
	format: string;
	data: Uint8Array;
}

interface ResultsTableProps {
	results: ConversionResult[];
	onDownloadSingle: (index: number) => void;
	onDownloadAll: () => void;
	downloadError?: string | null;
	disabled?: boolean;
}

export const ResultsTable = ({
	results,
	onDownloadSingle,
	onDownloadAll,
	downloadError,
	disabled = false,
}: ResultsTableProps) => {
	if (results.length === 0) {
		return null;
	}

	return (
		<Stack>
			<Title order={3}>Results</Title>
			<Table>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Filename</Table.Th>
						<Table.Th>Format</Table.Th>
						<Table.Th>Size</Table.Th>
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{results.map((result, index) => (
						<Table.Tr key={result.name}>
							<Table.Td>{result.name}</Table.Td>
							<Table.Td>{result.format}</Table.Td>
							<Table.Td>{formatFileSize(result.data.byteLength)}</Table.Td>
							<Table.Td style={{ textAlign: 'right' }}>
								<ActionIcon
									variant="subtle"
									onClick={() => onDownloadSingle(index)}
									title="Download file"
									disabled={disabled}
								>
									<IconFileDownload size={18} />
								</ActionIcon>
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
			<Button
				onClick={onDownloadAll}
				leftSection={<IconFileDownload size={18} />}
				disabled={disabled}
				size="md"
			>
				{disabled ? 'Creating ZIP...' : 'Download All (.zip)'}
			</Button>
			{downloadError && (
				<Text size="sm" c="red">
					{downloadError}
				</Text>
			)}
		</Stack>
	);
};
