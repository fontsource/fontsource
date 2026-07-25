import {
	buildFont,
	convertFont,
	createFontContext,
	type FontBuildConfig,
	type FontFileFormat,
	type FontInspection,
	inspectFont,
} from '@fontsource-utils/core';
import { Zip, ZipPassThrough } from 'fflate';
import { useMemo, useState } from 'react';
import { resolveConversionArtifacts } from '@/components/tools/artifacts';
import {
	type FontOutputSettings,
	type FontSourceEntry,
	type FontToolPreset,
	useFontToolsSession,
} from '@/components/tools/FontToolsProvider';
import { processWithConcurrency } from '@/utils/processWithConcurrency';

export type {
	FontOutputSettings,
	FontSourceEntry,
	FontToolPreset,
} from '@/components/tools/FontToolsProvider';

type ArtifactFormat = FontFileFormat | 'css';

export interface FontArtifact {
	filename: string;
	format: ArtifactFormat;
	data: Uint8Array;
	sourceId?: number;
	familyId?: string;
}

export interface FontFamilyGroup {
	id: string;
	name: string;
	sourceIds: number[];
	faces: FontInspection[];
}

const MAX_PROJECT_BYTES = 250 * 1024 ** 2;

const slugify = (value: string): string =>
	value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '') || 'font';

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

const clearProcessingErrors = (sources: FontSourceEntry[]): FontSourceEntry[] =>
	sources.map((source) =>
		source.inspection ? { ...source, error: undefined } : source,
	);

export const useFontWorkbench = (preset: FontToolPreset) => {
	const {
		nextSourceId,
		stopRequested,
		sources,
		setSources,
		outputs,
		setOutputs,
		activePreset,
		setActivePreset,
	} = useFontToolsSession();
	const [artifacts, setArtifacts] = useState<FontArtifact[]>([]);
	const [familyErrors, setFamilyErrors] = useState<Record<string, string>>({});
	const [projectError, setProjectError] = useState<string>();
	const [projectNotice, setProjectNotice] = useState<string>();
	const [isCreatingZip, setIsCreatingZip] = useState(false);
	const [isStopping, setIsStopping] = useState(false);
	const [progress, setProgress] = useState({ value: 0, text: '' });
	const output = outputs[preset];
	const packageOutput = preset === 'optimizer';
	const isProcessing = activePreset === preset;
	const isSessionProcessing = activePreset !== undefined;

	const families = useMemo<FontFamilyGroup[]>(() => {
		const grouped = new Map<string, FontFamilyGroup>();

		for (const source of sources) {
			const face = source.inspection;
			if (!face) continue;
			const family = grouped.get(face.familyName) ?? {
				id: slugify(face.familyName),
				name: face.familyName,
				sourceIds: [],
				faces: [],
			};

			family.sourceIds.push(source.id);
			family.faces.push(face);
			grouped.set(face.familyName, family);
		}

		const usedIds = new Map<string, number>();
		return [...grouped.values()]
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((family) => {
				const duplicateCount = usedIds.get(family.id) ?? 0;
				usedIds.set(family.id, duplicateCount + 1);
				return duplicateCount === 0
					? family
					: { ...family, id: `${family.id}-${duplicateCount + 1}` };
			});
	}, [sources]);

	const resetResults = () => {
		setArtifacts([]);
		setFamilyErrors({});
		setSources(clearProcessingErrors);
		setProjectError(undefined);
		setProjectNotice(undefined);
	};

	const updateOutput = (next: FontOutputSettings) => {
		setOutputs((current) => ({ ...current, [preset]: next }));
		resetResults();
	};

	const addFiles = async (files: File[]) => {
		setProjectError(undefined);
		setProjectNotice(undefined);
		const entries: FontSourceEntry[] = files.map((file) => ({
			id: nextSourceId.current++,
			file,
			inspection: null,
		}));
		if (entries.length === 0) return;
		const totalBytes = [...sources, ...entries].reduce(
			(total, source) => total + source.file.size,
			0,
		);
		if (totalBytes > MAX_PROJECT_BYTES) {
			setProjectError(
				'The selected files would exceed the 250 MB batch limit. Remove some font files or choose fewer files.',
			);
			return;
		}

		resetResults();
		setSources((current) => [...current, ...entries]);
		const ctx = createFontContext();

		try {
			await processWithConcurrency(
				entries,
				async (entry) => {
					try {
						const inspection = await inspectFont(
							ctx,
							new Uint8Array(await entry.file.arrayBuffer()),
						);

						setSources((current) =>
							current.map((source) =>
								source.id === entry.id ? { ...source, inspection } : source,
							),
						);
					} catch {
						setSources((current) =>
							current.map((source) =>
								source.id === entry.id
									? {
											...source,
											error:
												'We could not read this file as a font. Try another copy.',
										}
									: source,
							),
						);
					}
				},
				() => stopRequested.current,
			);
		} finally {
			ctx.destroy();
		}
	};

	const removeSource = (id: number) => {
		setProjectNotice(undefined);
		setSources((current) => current.filter((source) => source.id !== id));
		resetResults();
	};

	const clearAll = () => {
		setSources([]);
		setArtifacts([]);
		setFamilyErrors({});
		setProjectError(undefined);
		setProjectNotice(undefined);
	};

	const rejectFiles = () => {
		setProjectNotice(undefined);
		setProjectError(
			'Some files were not added. Choose TTF, OTF, WOFF, or WOFF2 files, and keep the batch under 250 MB.',
		);
	};

	const runConversion = async () => {
		const requestedFormats = (
			Object.entries(output.formats) as Array<[FontFileFormat, boolean]>
		)
			.filter(([, enabled]) => enabled)
			.map(([format]) => format);
		const validSources = sources.filter((source) => source.inspection);
		const ctx = createFontContext();
		let completed = 0;

		try {
			const processed = await processWithConcurrency(
				validSources,
				async (source) => {
					try {
						const converted = await convertFont(
							ctx,
							new Uint8Array(await source.file.arrayBuffer()),
							requestedFormats,
							source.file.name,
						);
						return { source, converted };
					} catch {
						setSources((current) =>
							current.map((entry) =>
								entry.id === source.id
									? {
											...entry,
											error:
												'We could not convert this font. Try another copy.',
										}
									: entry,
							),
						);
						return { source, converted: [] };
					} finally {
						completed++;
						setProgress({
							value: (completed / validSources.length) * 100,
							text: `${completed} of ${validSources.length} ${validSources.length === 1 ? 'font' : 'fonts'} processed`,
						});
					}
				},
				() => stopRequested.current,
			);

			const resolved = resolveConversionArtifacts(
				processed.results.map(({ source, converted }) => ({
					sourceId: source.id,
					results: converted,
				})),
			);
			setArtifacts(resolved.artifacts);
			if (resolved.renamedArtifactCount > 0) {
				setProjectNotice(
					`Renamed ${resolved.renamedArtifactCount} output ${resolved.renamedArtifactCount === 1 ? 'file' : 'files'} to avoid duplicate ${resolved.renamedArtifactCount === 1 ? 'filename' : 'filenames'}.`,
				);
			}

			return {
				processedCount: processed.processedCount,
				totalCount: validSources.length,
				stopped: processed.stopped,
			};
		} finally {
			ctx.destroy();
		}
	};

	const runPackageBuild = async () => {
		const formats = (['woff2', 'woff'] as const).filter(
			(format) => output.formats[format],
		);
		const ctx = createFontContext();
		const errors: Record<string, string> = {};
		const familyProgress = Array<number>(families.length).fill(0);
		let totalProgress = 0;

		try {
			const processed = await processWithConcurrency(
				families,
				async (family, index) => {
					const familySources = sources.filter((source) =>
						family.sourceIds.includes(source.id),
					);
					const updateFamilyProgress = (value: number) => {
						totalProgress += value - (familyProgress[index] ?? 0);
						familyProgress[index] = value;
						setProgress({
							value: (totalProgress / families.length) * 100,
							text:
								families.length === 1
									? `Optimizing ${family.name}…`
									: `Optimizing ${families.length} font families…`,
						});
					};
					const familyArtifacts: FontArtifact[] = [];

					try {
						const shared = {
							id: family.id,
							family: family.name,
							characters: 'all' as const,
							formats,
						};
						const config: FontBuildConfig = family.faces.some(
							(face) => face.axes.length > 0,
						)
							? {
									...shared,
									type: 'variable',
								}
							: { ...shared, type: 'static' };
						const buffers: Uint8Array[] = [];
						for (const { file } of familySources) {
							buffers.push(new Uint8Array(await file.arrayBuffer()));
						}
						const result = await buildFont(ctx, buffers, config, {
							css: {
								display: output.display,
								resolver: ({ source }) =>
									`${output.path.trim().replace(/\/$/, '') || '.'}/${source.filename}`,
							},
							onProgress: updateFamilyProgress,
						});

						for (const font of result.fonts) {
							familyArtifacts.push({
								filename: `${family.id}/${font.filename}`,
								format: font.format,
								data: font.content,
								familyId: family.id,
							});
						}

						if (output.includeCss) {
							const css = result.css.find(
								(asset) => asset.filename === 'index.css',
							);
							if (css) {
								familyArtifacts.push({
									filename: `${family.id}/index.css`,
									format: 'css',
									data: new TextEncoder().encode(css.content),
									familyId: family.id,
								});
							}
						}
					} catch (error) {
						errors[family.id] =
							error instanceof Error &&
							error.message.startsWith(
								'Multiple distinct fonts would be written',
							)
								? 'This family has more than one file for the same weight and style. Remove the duplicate and try again.'
								: 'We could not optimize this family. Try another copy of its font files.';
					} finally {
						updateFamilyProgress(1);
					}

					return familyArtifacts;
				},
				() => stopRequested.current,
			);
			setArtifacts(processed.results.flat());
			setFamilyErrors(errors);

			return {
				processedCount: processed.processedCount,
				totalCount: families.length,
				stopped: processed.stopped,
			};
		} finally {
			ctx.destroy();
		}
	};

	const processFiles = async () => {
		if (isSessionProcessing || sources.length === 0) return;
		const formatCount = packageOutput
			? Number(output.formats.woff) + Number(output.formats.woff2)
			: Object.values(output.formats).filter(Boolean).length;
		if (formatCount === 0) {
			setProjectError('Select at least one output format.');
			return;
		}

		setActivePreset(preset);
		setProjectError(undefined);
		setProjectNotice(undefined);
		setArtifacts([]);
		setFamilyErrors({});
		setSources(clearProcessingErrors);
		stopRequested.current = false;
		setIsStopping(false);
		setProgress({
			value: 0,
			text: packageOutput
				? 'Preparing font families…'
				: 'Preparing font files…',
		});

		try {
			const result = packageOutput
				? await runPackageBuild()
				: await runConversion();
			if (result.stopped) {
				setProjectNotice(
					`${packageOutput ? 'Optimization' : 'Conversion'} stopped after ${result.processedCount} of ${result.totalCount} ${packageOutput ? 'families' : 'fonts'}. Any completed files are ready below.`,
				);
			}
		} catch {
			setProjectError(
				packageOutput
					? 'Optimization could not finish. Your font files are still available. Try again.'
					: 'Conversion could not finish. Your font files are still available. Try again.',
			);
		} finally {
			stopRequested.current = false;
			setIsStopping(false);
			setActivePreset((current) => (current === preset ? undefined : current));
		}
	};

	const stopProcessing = () => {
		if (!isProcessing || isStopping) return;
		stopRequested.current = true;
		setIsStopping(true);
		setProgress((current) => ({
			...current,
			text: packageOutput
				? 'Finishing active families before stopping…'
				: 'Finishing active fonts before stopping…',
		}));
	};

	const downloadArtifact = (artifact: FontArtifact) => {
		setProjectError(undefined);
		try {
			triggerDownload(
				artifact.filename.split('/').pop() ?? artifact.filename,
				new Blob([artifact.data as BlobPart], {
					type:
						artifact.format === 'css' ? 'text/css' : `font/${artifact.format}`,
				}),
			);
		} catch {
			setProjectError(`Download failed for ${artifact.filename}. Try again.`);
		}
	};

	const downloadAll = () => {
		if (artifacts.length === 0 || isCreatingZip) return;
		setIsCreatingZip(true);
		setProjectError(undefined);
		let failed = false;
		const fail = () => {
			if (failed) return;
			failed = true;
			setProjectError(
				`The ZIP file could not be created. Try ${preset === 'converter' ? 'Download all as ZIP' : 'Download package'} again.`,
			);
			setIsCreatingZip(false);
		};

		try {
			const zip = new Zip();
			const chunks: BlobPart[] = [];

			zip.ondata = (error, data, final) => {
				if (failed) return;
				if (error) {
					fail();
					return;
				}
				chunks.push(data as BlobPart);
				if (final) {
					try {
						const archive = new Blob(chunks, { type: 'application/zip' });
						chunks.length = 0;
						triggerDownload(
							preset === 'converter'
								? 'fontsource-converted.zip'
								: 'fontsource-webfonts.zip',
							archive,
						);
						setIsCreatingZip(false);
					} catch {
						fail();
					}
				}
			};

			for (const artifact of artifacts) {
				const stream = new ZipPassThrough(artifact.filename);
				zip.add(stream);
				stream.push(artifact.data, true);
			}
			zip.end();
		} catch {
			fail();
		}
	};

	const isInspecting = sources.some(
		(source) => !source.inspection && !source.error,
	);

	return {
		sources,
		families,
		artifacts,
		output,
		updateOutput,
		familyErrors,
		projectError,
		projectNotice,
		isInspecting,
		isProcessing,
		isStopping,
		isSessionProcessing,
		activePreset,
		isCreatingZip,
		progress,
		packageOutput,
		addFiles,
		rejectFiles,
		removeSource,
		clearAll,
		processFiles,
		stopProcessing,
		downloadArtifact,
		downloadAll,
	};
};
