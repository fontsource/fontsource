import {
	type FontRef,
	GlyphtContext,
	WoffCompressionContext,
} from '@glypht/core';
import { useObservable } from '@legendapp/state/react';
import { Zip, ZipPassThrough } from 'fflate';
import { useCallback, useEffect, useRef } from 'react';

// A counter to generate unique IDs for file entries for stable React keys.
let fileIdCounter = 0;

interface BaseFileEntry {
	id: number;
	file: File;
}

interface SuccessFileEntry extends BaseFileEntry {
	font: FontRef;
	error?: never;
}

interface ErrorFileEntry extends BaseFileEntry {
	font?: never;
	error: string;
}

export type FileEntry = SuccessFileEntry | ErrorFileEntry;

export interface ConverterState {
	files: FileEntry[];
	results: { name: string; format: string; data: Uint8Array }[];
	isConverting: boolean;
	isCreatingZip: boolean;
	progress: { value: number; text: string };
	formats: { ttf: boolean; woff: boolean; woff2: boolean };
	downloadError?: string;
}

const getContexts = () => {
	const glyphtContext = new GlyphtContext();
	const compressionContext = new WoffCompressionContext();
	return { glyphtContext, compressionContext };
};

const formatToMimeType: Record<string, string> = {
	TTF: 'font/ttf',
	WOFF: 'font/woff',
	WOFF2: 'font/woff2',
};

export const useFontConverter = () => {
	const contexts = useRef<{
		glyphtContext: GlyphtContext;
		compressionContext: WoffCompressionContext;
	} | null>(null);

	const state$ = useObservable<ConverterState>({
		files: [],
		results: [],
		isConverting: false,
		isCreatingZip: false,
		progress: { value: 0, text: '' },
		formats: { ttf: false, woff: false, woff2: true },
		downloadError: undefined,
	});

	// Cleanup contexts on unmount
	useEffect(() => {
		if (!contexts.current) {
			contexts.current = getContexts();
		}

		const { glyphtContext, compressionContext } = contexts.current;

		return () => {
			glyphtContext.destroy();
			compressionContext.destroy();
			contexts.current = null;
		};
	}, []);

	const handleFileChange = useCallback(
		async (newFiles: File[]) => {
			// If no new files or contexts, do nothing.
			if (!newFiles.length || !contexts.current) return;

			const { glyphtContext, compressionContext } = contexts.current;

			// Decompress files in parallel.
			const decompressionPromises = newFiles.map(async (file) => {
				const buffer = new Uint8Array(await file.arrayBuffer());
				const type = WoffCompressionContext.compressionType(buffer);

				const decompressedData = type
					? await compressionContext.decompressToTTF(buffer)
					: buffer;

				return { file, buffer: decompressedData };
			});

			const settledResults = await Promise.allSettled(decompressionPromises);

			const allNewEntries: FileEntry[] = [];
			const successfulDecompressions: { file: File; buffer: Uint8Array }[] = [];

			// Separate successful from failed decompressions.
			settledResults.forEach((result, index) => {
				if (result.status === 'fulfilled') {
					successfulDecompressions.push(result.value);
				} else {
					console.error(
						`Failed to decompress ${newFiles[index].name}:`,
						result.reason,
					);

					allNewEntries.push({
						id: fileIdCounter++,
						file: newFiles[index],
						error: 'Could not decompress file. It may be invalid.',
					});
				}
			});

			// Load all valid fonts in a single batch.
			if (successfulDecompressions.length > 0) {
				const fontBuffers = successfulDecompressions.map((d) => d.buffer);

				try {
					const loadedFonts = await glyphtContext.loadFonts(fontBuffers);
					const successfulEntries: FileEntry[] = successfulDecompressions.map(
						({ file }, i) => ({
							id: fileIdCounter++,
							file,
							font: loadedFonts[i],
						}),
					);

					allNewEntries.push(...successfulEntries);
				} catch (e) {
					console.error('Failed to load font batch:', e);
					const errorEntries: FileEntry[] = successfulDecompressions.map(
						({ file }) => ({
							id: fileIdCounter++,
							file,
							error: 'Failed to load font. File may be corrupted.',
						}),
					);

					allNewEntries.push(...errorEntries);
				}
			}

			state$.files.push(...allNewEntries);
		},
		[state$],
	);

	const convertFiles = useCallback(async () => {
		const filesToConvert = state$.files
			.get()
			.filter((f): f is SuccessFileEntry => !!f.font);

		// If no contexts or no valid files, do nothing.
		if (!contexts.current || filesToConvert.length === 0) return;

		const { compressionContext } = contexts.current;

		state$.isConverting.set(true);
		state$.results.set([]);
		state$.progress.set({ value: 0, text: 'Starting conversion...' });

		let completedCount = 0;
		const totalFiles = filesToConvert.length;

		const allConversionPromises = filesToConvert.map(async ({ file, font }) => {
			const baseName = file.name.split('.').slice(0, -1).join('.');
			const fontResults: { name: string; format: string; data: Uint8Array }[] =
				[];

			const ttfData = await font.subset(null).then((f) => f.data);
			const { ttf, woff, woff2 } = state$.formats.get();
			const compressionPromises = [];

			if (ttf) {
				fontResults.push({
					name: `${baseName}.ttf`,
					format: 'TTF',
					data: ttfData,
				});
			}

			if (woff) {
				compressionPromises.push(
					compressionContext
						.compressFromTTF(ttfData, 'woff', 15)
						.then((data) => {
							fontResults.push({
								name: `${baseName}.woff`,
								format: 'WOFF',
								data,
							});
						}),
				);
			}

			if (woff2) {
				compressionPromises.push(
					compressionContext
						.compressFromTTF(ttfData, 'woff2', 11)
						.then((data) => {
							fontResults.push({
								name: `${baseName}.woff2`,
								format: 'WOFF2',
								data,
							});
						}),
				);
			}

			await Promise.all(compressionPromises);

			completedCount++;
			state$.progress.set({
				value: (completedCount / totalFiles) * 100,
				text: `Converting ${file.name}...`,
			});

			return fontResults;
		});

		const allResults = await Promise.all(allConversionPromises);
		state$.results.set(allResults.flat());
		state$.isConverting.set(false);
		state$.progress.set({ value: 100, text: 'Conversion complete!' });
	}, [state$]);

	const removeFileById = useCallback(
		(id: number) => {
			const index = state$.files.get().findIndex((f) => f.id === id);

			if (index !== -1) {
				const fileEntry = state$.files[index].get();

				if (fileEntry?.font) {
					fileEntry.font.destroy();
				}

				state$.files.splice(index, 1);
			}
		},
		[state$],
	);

	const clearAllFiles = useCallback(() => {
		state$.files.get().forEach(({ font }) => {
			if (font) font.destroy();
		});

		state$.files.set([]);
		state$.results.set([]);
		state$.downloadError.set(undefined);
	}, [state$]);

	const downloadFile = useCallback(
		(result: { name: string; format: string; data: Uint8Array }) => {
			const mimeType =
				formatToMimeType[result.format] || 'application/octet-stream';

			// Create a blob and trigger a download.
			const blob = new Blob([result.data as BlobPart], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = result.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		},
		[],
	);

	const downloadSingleFile = useCallback(
		(index: number) => {
			const result = state$.results[index].get();

			if (result) downloadFile(result);
		},
		[state$, downloadFile],
	);

	const downloadAll = useCallback(() => {
		const results = state$.results.get();
		if (results.length === 0) return;

		// Clear any previous download errors and set ZIP creation state
		state$.downloadError.set(undefined);
		state$.isCreatingZip.set(true);

		// Set progress to show ZIP creation is starting
		state$.progress.set({ value: 0, text: 'Creating ZIP file...' });

		const zip = new Zip();
		const chunks: Uint8Array[] = [];
		let filesAdded = 0;
		const totalFiles = results.length;

		// Set up the zip data handler
		zip.ondata = (err: Error | null, data: Uint8Array, final: boolean) => {
			if (err) {
				console.error('Failed to create zip file:', err);
				state$.downloadError.set(
					'Failed to create ZIP file. Please try downloading files individually.',
				);
				state$.progress.set({ value: 0, text: '' });
				state$.isCreatingZip.set(false);
				return;
			}

			chunks.push(data);

			if (final) {
				try {
					state$.progress.set({ value: 90, text: 'Preparing download...' });

					// Create a blob and trigger a download
					const blob = new Blob(chunks as BlobPart[], {
						type: 'application/zip',
					});
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'fontsource-converted.zip';
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);

					// Clear progress after successful download
					state$.progress.set({ value: 100, text: 'ZIP download complete!' });
					state$.isCreatingZip.set(false);
					setTimeout(() => {
						state$.progress.set({ value: 0, text: '' });
					}, 2000);
				} catch (downloadErr) {
					console.error('Failed to download zip file:', downloadErr);
					state$.downloadError.set(
						'Failed to download ZIP file. Please try again.',
					);
					state$.progress.set({ value: 0, text: '' });
					state$.isCreatingZip.set(false);
				}
			}
		};

		// Stream files one by one with progress updates
		results.forEach((result) => {
			const fileStream = new ZipPassThrough(result.name);
			zip.add(fileStream);
			fileStream.push(result.data, true);

			filesAdded++;
			const progressValue = (filesAdded / totalFiles) * 80; // Reserve 80% for file processing
			state$.progress.set({
				value: progressValue,
				text: `Adding ${result.name} to ZIP...`,
			});
		});

		// Finalize the zip
		zip.end();
	}, [state$]);

	return {
		state$,
		handleFileChange,
		convertFiles,
		removeFileById,
		clearAllFiles,
		downloadSingleFile,
		downloadAll,
	};
};
