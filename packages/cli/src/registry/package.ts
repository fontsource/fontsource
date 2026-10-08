import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { FontBuildResult } from '@fontsource-utils/core';
import type { RegistryFamilyDetail } from '../../../../api/shared/registry';

/** Package only generated outputs; frozen build inputs stay outside the package. */
export async function writePackage(
	directory: string,
	family: RegistryFamilyDetail,
	result: FontBuildResult,
	variable: boolean,
) {
	if (!result.css.some((asset) => asset.filename === 'index.css'))
		throw new Error(`${family.id}: build produced no index.css`);
	const name = `@fontsource${variable ? '-variable' : ''}/${family.id}`;
	const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
	const assets = [
		...result.fonts,
		...result.css,
		{ filename: 'LICENSE', content: family.license.text },
		{ filename: 'index.d.css.ts', content: 'export {};\n' },
		{ filename: 'metadata.json', content: json(family) },
		{
			filename: 'package.json',
			content: json({
				name,
				version: '6.0.0',
				description: `Self-host the ${family.family} font.`,
				license: family.license.id,
				main: 'index.css',
				types: 'index.d.css.ts',
				exports: {
					'.': { types: './index.d.css.ts', default: './index.css' },
					'./*.css': './*.css',
					'./files/*': './files/*',
					'./LICENSE': './LICENSE',
					'./package.json': './package.json',
					'./metadata.json': './metadata.json',
					'./*': './*.css',
				},
			}),
		},
		{
			filename: 'README.md',
			content: `# ${family.family}\n\nSelf-host the ${family.family} font.\n\n\`\`\`js\nimport '${name}';\n\`\`\`\n`,
		},
	];
	for (const asset of assets) {
		const path = join(directory, asset.filename);
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, asset.content);
	}
}
