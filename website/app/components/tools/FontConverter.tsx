import { observer } from '@legendapp/state/react';
import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { IconTransform } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';
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

	const resultsRef = useRef<HTMLDivElement>(null);
	const fileListRef = useRef<HTMLDivElement>(null);
	// Track file count changes for scrolling logic.
	const prevFilesLength = useRef(0);

	const files = state$.files.get();
	const results = state$.results.get();
	const isConverting = state$.isConverting.get();
	const isCreatingZip = state$.isCreatingZip.get();
	const formats = state$.formats.get();
	const progress = state$.progress.get();
	const downloadError = state$.downloadError.get();

	const hasValidFiles = files.some((f) => !!f.font);

	// Scroll to the file list when new files are added.
	useEffect(() => {
		// Scroll only when files are added, not when they are removed
		if (files.length > prevFilesLength.current && fileListRef.current) {
			fileListRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}
		prevFilesLength.current = files.length;
	}, [files.length]);

	// Scroll to the results table when conversion is complete.
	useEffect(() => {
		if (results.length > 0 && !isConverting && resultsRef.current) {
			resultsRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}
	}, [results, isConverting]);

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

				<div ref={fileListRef}>
					{files.length > 0 && (
						<FileList
							files={files}
							onRemoveFile={removeFileById}
							onClearAll={clearAllFiles}
							disabled={isConverting || isCreatingZip}
						/>
					)}
				</div>

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

				<div ref={resultsRef}>
					{results.length > 0 && !isConverting && (
						<ResultsTable
							results={results}
							onDownloadSingle={downloadSingleFile}
							onDownloadAll={downloadAll}
							downloadError={downloadError}
							disabled={isCreatingZip}
						/>
					)}
				</div>
			</Stack>
		</Container>
	);
});
