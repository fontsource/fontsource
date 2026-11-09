import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { FontBuildResult } from '@fontsource-utils/core';
import type { PackageOutputManifest } from '../../../../api/shared/package-output';
import type { RegistryFamilyDetail } from '../../../../api/shared/registry';
import { packageSass } from './sass';

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
			filename: 'scss/metadata.scss',
			content: packageSass(family.id, family.family, result, variable),
		},
		{
			filename: 'CHANGELOG.md',
			content: `# Changelog\n\nSee the [Fontsource release history](https://github.com/fontsource/font-files/commits/main).\n`,
		},
		{
			filename: 'manifest.json',
			content: json({
				schemaVersion: 1,
				family: family.family,
				sourceModified: family.sourceModified,
				faces: result.faces,
				entrypoints: result.entrypoints,
			} satisfies PackageOutputManifest),
		},
		{
			filename: 'package.json',
			content: json({
				name,
				version: '6.0.0',
				description: `Self-host the ${family.family} font.`,
				license: family.license.id,
				homepage: `https://fontsource.org/fonts/${family.id}`,
				repository: {
					type: 'git',
					url: 'https://github.com/fontsource/font-files.git',
				},
				funding: 'https://github.com/sponsors/ayuhito',
				publishHash: '',
				main: 'index.css',
				types: 'index.d.css.ts',
				exports: {
					'.': { types: './index.d.css.ts', default: './index.css' },
					'./*.css': './*.css',
					'./files/*': './files/*',
					'./LICENSE': './LICENSE',
					'./package.json': './package.json',
					'./metadata.json': './metadata.json',
					'./manifest.json': './manifest.json',
					'./scss': './scss/metadata.scss',
					'./scss/*': './scss/*',
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
