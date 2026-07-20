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
import { useMemo, useRef, useState } from 'react';

export type FontToolPreset = 'converter' | 'optimizer';
type ArtifactFormat = FontFileFormat | 'css';

interface FontSourceEntry {
	id: number;
	file: File;
	inspection: FontInspection | null;
	error?: string;
}

interface FontArtifact {
	filename: string;
	format: ArtifactFormat;
	data: Uint8Array;
	sourceId?: number;
	familyId?: string;
}

interface FontFamilyGroup {
	id: string;
	name: string;
	sourceIds: number[];
	faces: FontInspection[];
}

interface FontOutputSettings {
	formats: { woff2: boolean; woff: boolean; ttf: boolean };
	includeCss: boolean;
	display: string;
	path: string;
	preserveNames: boolean;
}

const MAX_PROJECT_BYTES = 250 * 1024 ** 2;

const defaultOutput = (preset: FontToolPreset): FontOutputSettings => {
	const optimize = preset === 'optimizer';
	return {
		formats: { woff2: true, woff: false, ttf: false },
		includeCss: optimize,
		display: 'swap',
		path: './files',
		preserveNames: !optimize,
	};
};

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
	const nextId = useRef(0);
	const [sources, setSources] = useState<FontSourceEntry[]>([]);
	const [artifacts, setArtifacts] = useState<FontArtifact[]>([]);
	const [output, setOutput] = useState(() => defaultOutput(preset));
	const [familyErrors, setFamilyErrors] = useState<Record<string, string>>({});
	const [projectError, setProjectError] = useState<string>();
	const [isProcessing, setIsProcessing] = useState(false);
	const [isCreatingZip, setIsCreatingZip] = useState(false);
	const [progress, setProgress] = useState({ value: 0, text: '' });
	const packageOutput = output.includeCss || !output.preserveNames;
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
	};

	const updateOutput = (next: FontOutputSettings) => {
		setOutput(next);
		resetResults();
	};

	const addFiles = async (files: File[]) => {
		setProjectError(undefined);
		const currentFingerprints = new Set(
			sources.map(
				({ file }) => `${file.name}:${file.size}:${file.lastModified}`,
			),
		);
		const entries: FontSourceEntry[] = [];

		for (const file of files) {
			const fingerprint = `${file.name}:${file.size}:${file.lastModified}`;
			if (currentFingerprints.has(fingerprint)) continue;
			currentFingerprints.add(fingerprint);
			entries.push({
				id: nextId.current++,
				file,
				inspection: null,
			});
		}

		if (entries.length === 0) return;
		const totalBytes = [...sources, ...entries].reduce(
			(total, source) => total + source.file.size,
			0,
		);
		if (totalBytes > MAX_PROJECT_BYTES) {
			setProjectError('This batch is larger than the 250 MB browser limit.');
			return;
		}

		resetResults();
		setSources((current) => [...current, ...entries]);
		const ctx = createFontContext();

		try {
			await Promise.all(
				entries.map(async (entry) => {
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
											error: 'This file could not be read as a font.',
										}
									: source,
							),
						);
					}
				}),
			);
		} finally {
			ctx.destroy();
		}
	};

	const removeSource = (id: number) => {
		setSources((current) => current.filter((source) => source.id !== id));
		resetResults();
	};

	const clearAll = () => {
		setSources([]);
		setArtifacts([]);
		setFamilyErrors({});
		setProjectError(undefined);
	};

	const rejectFiles = () => {
		setProjectError(
			'Use TTF, OTF, WOFF, or WOFF2 files. The total batch limit is 250 MB.',
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
			const results = await Promise.all(
				validSources.map(async (source) => {
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
											error: 'Font conversion failed.',
										}
									: entry,
							),
						);
						return { source, converted: [] };
					} finally {
						completed++;
						setProgress({
							value: (completed / validSources.length) * 100,
							text: `Converted ${source.file.name}`,
						});
					}
				}),
			);

			const bestByFilename = new Map<
				string,
				{ artifact: FontArtifact; priority: number }
			>();
			for (const { source, converted } of results) {
				const extension =
					source.file.name.split('.').pop()?.toLowerCase() ?? '';
				const sourceFormat = extension === 'otf' ? 'ttf' : extension;
				const sourceQuality =
					sourceFormat === 'ttf' ? 3 : sourceFormat === 'woff' ? 2 : 1;

				for (const result of converted) {
					const priority =
						(sourceFormat === result.format ? 10 : 0) + sourceQuality;
					const artifact: FontArtifact = {
						filename: result.filename,
						format: result.format,
						data: result.data,
						sourceId: source.id,
					};
					const current = bestByFilename.get(result.filename);
					if (!current || priority > current.priority) {
						bestByFilename.set(result.filename, { artifact, priority });
					}
				}
			}
			setArtifacts(
				[...bestByFilename.values()].map(({ artifact }) => artifact),
			);
		} finally {
			ctx.destroy();
		}
	};

	const runPackageBuild = async () => {
		const formats = (['woff2', 'woff'] as const).filter(
			(format) => output.formats[format],
		);
		const ctx = createFontContext();
		const builtArtifacts: FontArtifact[] = [];
		const errors: Record<string, string> = {};

		try {
			for (const [index, family] of families.entries()) {
				const familySources = sources.filter((source) =>
					family.sourceIds.includes(source.id),
				);
				setProgress({
					value: (index / families.length) * 100,
					text: `Optimizing ${family.name}`,
				});

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
					const result = await buildFont(
						ctx,
						await Promise.all(
							familySources.map(
								async ({ file }) => new Uint8Array(await file.arrayBuffer()),
							),
						),
						config,
						{
							css: {
								display: output.display,
								resolver: ({ source }) =>
									`${output.path.trim().replace(/\/$/, '') || '.'}/${source.filename}`,
							},
							onProgress: (familyProgress) =>
								setProgress({
									value: ((index + familyProgress) / families.length) * 100,
									text: `Optimizing ${family.name}`,
								}),
						},
					);

					for (const font of result.fonts) {
						builtArtifacts.push({
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
							builtArtifacts.push({
								filename: `${family.id}/index.css`,
								format: 'css',
								data: new TextEncoder().encode(css.content),
								familyId: family.id,
							});
						}
					}
					setArtifacts([...builtArtifacts]);
				} catch (error) {
					errors[family.id] =
						error instanceof Error &&
						error.message.startsWith('Multiple distinct fonts would be written')
							? 'Multiple different files have the same family, weight, and style.'
							: 'This family could not be optimized.';
				}
			}
			setFamilyErrors(errors);
		} finally {
			ctx.destroy();
		}
	};

	const processFiles = async () => {
		if (isProcessing || sources.length === 0) return;
		const formatCount = packageOutput
			? Number(output.formats.woff) + Number(output.formats.woff2)
			: Object.values(output.formats).filter(Boolean).length;
		if (formatCount === 0) {
			setProjectError('Select at least one output format.');
			return;
		}

		setIsProcessing(true);
		setProjectError(undefined);
		setArtifacts([]);
		setFamilyErrors({});
		setSources(clearProcessingErrors);
		setProgress({
			value: 0,
			text: packageOutput ? 'Preparing package…' : 'Preparing conversion…',
		});

		try {
			if (packageOutput) {
				await runPackageBuild();
			} else {
				await runConversion();
			}
		} finally {
			setIsProcessing(false);
		}
	};

	const downloadArtifact = (artifact: FontArtifact) => {
		triggerDownload(
			artifact.filename.split('/').pop() ?? artifact.filename,
			new Blob([artifact.data as BlobPart], {
				type:
					artifact.format === 'css' ? 'text/css' : `font/${artifact.format}`,
			}),
		);
	};

	const downloadAll = () => {
		if (artifacts.length === 0 || isCreatingZip) return;
		setIsCreatingZip(true);
		setProjectError(undefined);
		const zip = new Zip();
		const chunks: BlobPart[] = [];

		zip.ondata = (error, data, final) => {
			if (error) {
				setProjectError(
					'The ZIP could not be created. Try Download all again.',
				);
				setIsCreatingZip(false);
				return;
			}
			chunks.push(data as BlobPart);
			if (final) {
				triggerDownload(
					preset === 'converter'
						? 'fontsource-converted.zip'
						: 'fontsource-webfonts.zip',
					new Blob(chunks, { type: 'application/zip' }),
				);
				setIsCreatingZip(false);
			}
		};

		for (const artifact of artifacts) {
			const stream = new ZipPassThrough(artifact.filename);
			zip.add(stream);
			stream.push(artifact.data, true);
		}
		zip.end();
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
		isInspecting,
		isProcessing,
		isCreatingZip,
		progress,
		packageOutput,
		addFiles,
		rejectFiles,
		removeSource,
		clearAll,
		processFiles,
		downloadArtifact,
		downloadAll,
	};
};
