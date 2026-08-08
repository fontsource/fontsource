import type { ProjectItem } from './model';
import { getProjectCss } from './output';

const DOWNLOAD_ORIGIN = 'https://api.fontsource.org';
const MAX_ARCHIVE_ATTEMPTS = 20;
const MAX_ARCHIVE_BYTES = 250 * 1024 * 1024;

class FontSetArchiveError extends Error {
	constructor(
		message: string,
		readonly code: 'too-large' | 'invalid-family',
	) {
		super(message);
		this.name = 'FontSetArchiveError';
	}
}

const abortError = () =>
	new DOMException('Archive creation aborted', 'AbortError');

const delay = (milliseconds: number, signal?: AbortSignal) =>
	new Promise<void>((resolve, reject) => {
		if (signal?.aborted) {
			reject(abortError());
			return;
		}

		const onAbort = () => {
			clearTimeout(timeout);
			reject(abortError());
		};
		const timeout = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, milliseconds);
		signal?.addEventListener('abort', onAbort, { once: true });
	});

const getArchive = async (familyId: string, signal?: AbortSignal) => {
	const url = `${DOWNLOAD_ORIGIN}/v1/download/${encodeURIComponent(familyId)}`;

	for (let attempt = 0; attempt < MAX_ARCHIVE_ATTEMPTS; attempt += 1) {
		const response = await fetch(url, { signal });
		if (response.status === 202) {
			await response.body?.cancel();
			const retryAfter = Number(response.headers.get('Retry-After')) || 3;
			await delay(Math.min(Math.max(retryAfter, 1), 5) * 1000, signal);
			continue;
		}
		if (!response.ok) throw new Error(`Unable to download ${familyId}`);

		const contentLength = Number(response.headers.get('Content-Length'));
		if (contentLength > MAX_ARCHIVE_BYTES) {
			throw new FontSetArchiveError('Font set is too large', 'too-large');
		}
		return new Uint8Array(await response.arrayBuffer());
	}

	throw new Error(`Timed out preparing ${familyId}`);
};

const safeArchivePath = (path: string) =>
	path
		.replaceAll('\\', '/')
		.split('/')
		.filter((part) => part && part !== '.' && part !== '..')
		.join('/');

const safeFamilyDirectory = (familyId: string) => {
	const directory = familyId
		.replace(/[^a-z0-9_-]+/gi, '-')
		.replace(/^-+|-+$/g, '');
	if (!directory) {
		throw new FontSetArchiveError('Invalid font family ID', 'invalid-family');
	}
	return directory;
};

interface FontSetArchiveOptions {
	getFamilyArchive?: typeof getArchive;
	maxExpandedBytes?: number;
	signal?: AbortSignal;
}

const createFontSetArchive = async (
	items: ProjectItem[],
	onProgress: (completed: number) => void,
	{
		getFamilyArchive = getArchive,
		maxExpandedBytes = MAX_ARCHIVE_BYTES,
		signal,
	}: FontSetArchiveOptions = {},
) => {
	const { strToU8, unzip, zip } = await import('fflate');
	const files: Record<string, Uint8Array> = {};
	let expandedBytes = 0;

	for (const [index, item] of items.entries()) {
		if (signal?.aborted) throw abortError();
		const archive = await getFamilyArchive(item.familyId, signal);
		const familyFiles = await new Promise<Record<string, Uint8Array>>(
			(resolve, reject) => {
				unzip(archive, (error, result) => {
					if (error) reject(error);
					else resolve(result);
				});
			},
		);
		const familyDirectory = safeFamilyDirectory(item.familyId);

		for (const [path, contents] of Object.entries(familyFiles)) {
			const safePath = safeArchivePath(path);
			if (!safePath) continue;
			expandedBytes += contents.byteLength;
			if (expandedBytes > maxExpandedBytes) {
				throw new FontSetArchiveError('Font set is too large', 'too-large');
			}
			files[`${familyDirectory}/${safePath}`] = contents;
		}
		onProgress(index + 1);
	}

	if (signal?.aborted) throw abortError();
	files['fontsource-font-set.css'] = strToU8(getProjectCss(items));
	const data = await new Promise<Uint8Array>((resolve, reject) => {
		zip(files, { consume: true, level: 6 }, (error, result) => {
			if (error) reject(error);
			else resolve(result);
		});
	});

	return new Blob([data as BlobPart], { type: 'application/zip' });
};

export { createFontSetArchive, FontSetArchiveError };
