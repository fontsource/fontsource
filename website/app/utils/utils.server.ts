import * as fs from 'fs/promises';
import type { HTTPError } from 'ky';
import ky from 'ky';
import * as path from 'pathe';

interface KyaOpts {
	text?: boolean;
}

// The error handling on ky is not too informative, so we change it up a little
export const kya = async (url: string, opts?: KyaOpts) => {
	const data = ky(url, {
		hooks: {
			beforeError: [
				(error: HTTPError) => {
					const { response } = error;
					if (response && response.body) {
						error.name = 'HTTPError';
						// @ts-ignore
						error.message = `Failed to fetch ${url} with ${response.body.message} (${response.status})`;
					}

					return error;
				},
			],
		},
	});

	if (opts?.text) return data.text() as any;

	return data.json() as any;
};

// We need know if a variable font may be a standard or variable font
const STANDARD_AXES = ['opsz', 'slnt', 'wdth', 'wght'] as const;
type StandardAxes = typeof STANDARD_AXES[number];

export const isStandardAxesKey = (axesKey: string): axesKey is StandardAxes =>
	STANDARD_AXES.includes(axesKey as StandardAxes);

// Return all slugs in a directory recursively
export const getAllSlugsInDir = async (dir: string) => {
	const files: string[] = [];

	const getFilesRecursively = async (
		directory: string,
		currentSlug?: string
	) => {
		const filesInDirectory = await fs.readdir(directory);
		for (const file of filesInDirectory) {
			const absolute = path.join(directory, file);
			const newSlug = currentSlug ? currentSlug + '/' + file : file;
			if ((await fs.stat(absolute)).isDirectory()) {
				await getFilesRecursively(absolute, newSlug);
			} else {
				// We only want to add mdx files
				if (file.endsWith('.mdx')) {
					files.push(newSlug.replace(/\.mdx$/, ''));
				}
			}
		}
	};

	await getFilesRecursively(dir);
	return files;
};
