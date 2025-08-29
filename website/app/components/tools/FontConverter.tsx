import { observer } from '@legendapp/state/react';
import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { IconTransform } from '@tabler/icons-react';
import { useFontConverter } from '@/hooks/useFontConverter';
import classes from '@/styles/global.module.css';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';
import { FormatSelector } from './FormatSelector';
import { ProgressIndicator } from './ProgressIndicator';
import { ResultsTable } from './ResultsTable';

export const FontConverter = observer(() => {
	const {
		state$,
		handleFileChange,
		convertFiles,
		removeFileById,
		clearAllFiles,
		downloadSingleFile,
		downloadAll,
	} = useFontConverter();

	const files = state$.files.get();
	const results = state$.results.get();
	const isConverting = state$.isConverting.get();
	const isCreatingZip = state$.isCreatingZip.get();
	const formats = state$.formats.get();
	const progress = state$.progress.get();
	const downloadError = state$.downloadError.get();

	const hasValidFiles = files.some((f) => !!f.font);

	const handleFormatChange = (
		format: keyof typeof formats,
		checked: boolean,
	) => {
		state$.formats[format].set(checked);
	};

	return (
		<Container className={classes.container}>
			<Stack gap="xl">
				<Title order={1}>Webfont Converter</Title>
				<Text>
					Optimize your fonts for the web. Drag and drop TTF, OTF, WOFF, or
					WOFF2 files below. All processing is done directly in your browser.
				</Text>

				<FileUpload
					onDrop={handleFileChange}
					disabled={isConverting || isCreatingZip}
				/>

				{files.length > 0 && (
					<FileList
						files={files}
						onRemoveFile={removeFileById}
						onClearAll={clearAllFiles}
						disabled={isConverting || isCreatingZip}
					/>
				)}

				<FormatSelector formats={formats} onFormatChange={handleFormatChange} />

				<Button
					onClick={convertFiles}
					disabled={isConverting || isCreatingZip || !hasValidFiles}
					size="md"
					leftSection={<IconTransform size={18} />}
				>
					{isConverting ? 'Converting...' : 'Convert'}
				</Button>

				<ProgressIndicator
					progress={progress}
					isVisible={isConverting || isCreatingZip}
				/>

				{results.length > 0 && !isConverting && (
					<ResultsTable
						results={results}
						onDownloadSingle={downloadSingleFile}
						onDownloadAll={downloadAll}
						downloadError={downloadError}
						disabled={isCreatingZip}
					/>
				)}
			</Stack>
		</Container>
	);
});
