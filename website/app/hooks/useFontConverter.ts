import {
	type ConversionResult,
	convertFont,
	createFontContext,
} from '@fontsource-utils/core';
import { useObservable } from '@legendapp/state/react';
import { Zip, ZipPassThrough } from 'fflate';
import { useCallback } from 'react';

// A counter to generate unique IDs for file entries for stable React keys.
let fileIdCounter = 0;

export interface FileEntry {
	id: number;
	file: File;
	error?: string;
}

export interface ConverterState {
	files: FileEntry[];
	results: ConversionResult[];
	isConverting: boolean;
	isCreatingZip: boolean;
	progress: { value: number; text: string };
	formats: { ttf: boolean; woff: boolean; woff2: boolean };
	downloadError?: string;
}

const formatToMimeType: Record<string, string> = {
	ttf: 'font/ttf',
	woff: 'font/woff',
	woff2: 'font/woff2',
};

const getFileFingerprint = (file: File) =>
	`${file.name}:${file.size}:${file.lastModified}`;

const triggerDownload = (filename: string, blob: Blob) => {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};

// Resolve filename collisions once so every download path uses the same names.
const resolveResultFilenames = (results: ConversionResult[]) => {
	const usedFilenames = new Set<string>();
	const nextSuffixByFilename = new Map<string, number>();

	return results.map((result) => {
		const originalFilename = result.filename;
		let filename = originalFilename;
		let nextSuffix = nextSuffixByFilename.get(originalFilename) ?? 2;

		// If a filename has already been used, append a suffix to the name.
		while (usedFilenames.has(filename)) {
			const extensionIndex = originalFilename.lastIndexOf('.');
			filename =
				extensionIndex === -1
					? `${originalFilename}-${nextSuffix}`
					: `${originalFilename.slice(0, extensionIndex)}-${nextSuffix}${originalFilename.slice(extensionIndex)}`;
			nextSuffix += 1;
		}

		usedFilenames.add(filename);
		nextSuffixByFilename.set(originalFilename, nextSuffix);

		return filename === originalFilename ? result : { ...result, filename };
	});
};

export const useFontConverter = () => {
	const state$ = useObservable<ConverterState>({
		files: [],
		results: [],
		isConverting: false,
		isCreatingZip: false,
		progress: { value: 0, text: '' },
		formats: { ttf: false, woff: false, woff2: true },
		downloadError: undefined,
	});

	// Handles new files being added to the converter.
	const handleFileChange = useCallback(
		(newFiles: File[]) => {
			// Use a compact fingerprint so duplicate checks stay linear as the list grows.
			const seenFiles = new Set(
				state$.files.get().map(({ file }) => getFileFingerprint(file)),
			);
			const uniqueNewFiles: FileEntry[] = [];

			for (const file of newFiles) {
				const fingerprint = getFileFingerprint(file);
				if (seenFiles.has(fingerprint)) {
					continue;
				}

				seenFiles.add(fingerprint);
				uniqueNewFiles.push({
					id: fileIdCounter++,
					file,
				});
			}

			if (uniqueNewFiles.length === 0) {
				return;
			}

			state$.results.set([]);
			state$.downloadError.set(undefined);
			state$.files.set((current) => [...current, ...uniqueNewFiles]);
		},
		[state$],
	);

	// Converts all staged files into the requested formats.
	const convertFiles = useCallback(async () => {
		const filesToConvert = state$.files.get();
		if (filesToConvert.length === 0) {
			return;
		}

		state$.isConverting.set(true);
		state$.results.set([]);
		state$.downloadError.set(undefined);
		state$.progress.set({ value: 0, text: 'Starting conversion...' });
		state$.files.set((currentFiles) =>
			currentFiles.map((fileEntry) => ({
				...fileEntry,
				error: undefined,
			})),
		);

		const { ttf, woff, woff2 } = state$.formats.get();
		const requestedFormats: Array<'ttf' | 'woff' | 'woff2'> = [];
		if (ttf) requestedFormats.push('ttf');
		if (woff) requestedFormats.push('woff');
		if (woff2) requestedFormats.push('woff2');

		let completedCount = 0;
		const totalFiles = filesToConvert.length;
		const ctx = createFontContext();

		try {
			// Convert every file independently so one failure does not block the rest.
			const settledResults = await Promise.all(
				filesToConvert.map(async ({ id, file }) => {
					try {
						const buffer = new Uint8Array(await file.arrayBuffer());
						const results = await convertFont(
							ctx,
							buffer,
							requestedFormats,
							file.name,
						);

						return {
							fileId: id,
							status: 'fulfilled' as const,
							results,
						};
					} catch (error) {
						console.error(`Conversion failed for ${file.name}:`, error);
						return {
							fileId: id,
							status: 'rejected' as const,
							error: 'Font conversion failed. This file may be invalid.',
						};
					} finally {
						completedCount++;
						state$.progress.set({
							value: (completedCount / totalFiles) * 100,
							text: `Converted ${file.name}`,
						});
					}
				}),
			);

			const fileErrors = new Map<number, string>();
			const successfulResults: ConversionResult[] = [];

			for (const result of settledResults) {
				if (result.status === 'fulfilled') {
					successfulResults.push(...result.results);
					continue;
				}

				fileErrors.set(result.fileId, result.error);
			}

			if (fileErrors.size > 0) {
				state$.files.set((currentFiles) =>
					currentFiles.map((fileEntry) => ({
						...fileEntry,
						error: fileErrors.get(fileEntry.id),
					})),
				);
			}

			const resolvedResults = resolveResultFilenames(successfulResults);

			// Resolve collisions once so the UI, single downloads, and ZIP stay consistent.
			state$.results.set(resolvedResults);
			state$.progress.set({ value: 100, text: 'Conversion complete!' });

			if (fileErrors.size > 0) {
				state$.downloadError.set(
					resolvedResults.length > 0
						? 'Some files could not be converted. Check the file list for details.'
						: 'Font conversion failed. One or more files may be invalid.',
				);
			}
		} finally {
			ctx.destroy();
			state$.isConverting.set(false);
		}
	}, [state$]);

	// Removes a file from the staging area.
	const removeFileById = useCallback(
		(id: number) => {
			const index = state$.files.get().findIndex((f) => f.id === id);
			if (index !== -1) {
				state$.files.splice(index, 1);
				state$.results.set([]);
				state$.downloadError.set(undefined);
			}
		},
		[state$],
	);

	// Clears all files and results.
	const clearAllFiles = useCallback(() => {
		state$.files.set([]);
		state$.results.set([]);
		state$.downloadError.set(undefined);
	}, [state$]);

	// Triggers a browser download for a single conversion result.
	const downloadFile = useCallback((result: ConversionResult) => {
		const mimeType =
			formatToMimeType[result.format] || 'application/octet-stream';
		triggerDownload(
			result.filename,
			new Blob([result.data as BlobPart], { type: mimeType }),
		);
	}, []);

	// Downloads a specific result by index.
	const downloadSingleFile = useCallback(
		(index: number) => {
			const result = state$.results[index].get();
			if (result) {
				downloadFile(result);
			}
		},
		[state$, downloadFile],
	);

	// Packages all results into a ZIP file and triggers a download.
	const downloadAll = useCallback(() => {
		const results = state$.results.get();
		if (results.length === 0) return;

		state$.downloadError.set(undefined);
		state$.isCreatingZip.set(true);
		state$.progress.set({ value: 0, text: 'Creating ZIP file...' });

		const zip = new Zip();
		const chunks: BlobPart[] = [];
		let filesAdded = 0;
		const totalFiles = results.length;

		zip.ondata = (err, data, final) => {
			if (err) {
				console.error('ZIP failed:', err);
				state$.downloadError.set(
					'Failed to create ZIP file. Please try downloading individually.',
				);
				state$.isCreatingZip.set(false);
				return;
			}

			chunks.push(data as BlobPart);

			if (final) {
				triggerDownload(
					'fontsource-converted.zip',
					new Blob(chunks, { type: 'application/zip' }),
				);

				state$.progress.set({ value: 100, text: 'Download complete!' });
				state$.isCreatingZip.set(false);
				setTimeout(() => state$.progress.set({ value: 0, text: '' }), 2000);
			}
		};

		for (const result of results) {
			const fileStream = new ZipPassThrough(result.filename);
			zip.add(fileStream);
			fileStream.push(result.data, true);
			filesAdded++;
			state$.progress.set({
				value: (filesAdded / totalFiles) * 100,
				text: `Adding ${result.filename}...`,
			});
		}

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
