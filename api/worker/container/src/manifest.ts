import { resolveFontFaces } from '@fontsource-utils/core';

import type { SourceFontMetadata, VariableAxes } from '../../shared/catalog';
import { buildFontConfig } from '../../shared/font-config';

export type ArtifactBuildMode = 'copy' | 'convert-woff-to-ttf';

export interface StaticArtifactPlanItem {
	filename: string;
	sourceFilename: string;
	archivePath: string;
	buildMode: ArtifactBuildMode;
	subset: string;
	weight: number;
	style: string;
	extension: 'woff2' | 'woff' | 'ttf';
}

export interface VariableArtifactPlanItem {
	filename: string;
	sourceFilename: string;
	archivePath: string;
	buildMode: ArtifactBuildMode;
	subset: string;
	axisKey: string;
	style: string;
	extension: 'woff2';
}

export const generateStaticManifest = (
	metadata: SourceFontMetadata,
): StaticArtifactPlanItem[] => {
	const config = buildFontConfig(metadata, {
		formats: ['woff2', 'woff', 'ttf'],
	});

	return resolveFontFaces(config).flatMap((face) => {
		const weight = face.weight;
		if (typeof weight !== 'number') {
			return [];
		}

		return face.sources.flatMap((source) => {
			if (
				source.format !== 'woff2' &&
				source.format !== 'woff' &&
				source.format !== 'ttf'
			) {
				return [];
			}

			const extension = source.format;
			const filename = `${face.subset}-${weight}-${face.style}.${extension}`;

			return {
				filename,
				sourceFilename:
					extension === 'ttf'
						? `${face.subset}-${weight}-${face.style}.woff`
						: filename,
				archivePath:
					extension === 'ttf'
						? `static/ttf/${source.filename}`
						: `static/webfonts/${source.filename}`,
				buildMode: extension === 'ttf' ? 'convert-woff-to-ttf' : 'copy',
				subset: face.subset,
				weight,
				style: face.style,
				extension,
			} satisfies StaticArtifactPlanItem;
		});
	});
};

export const generateVariableManifest = (
	metadata: SourceFontMetadata,
	axes: VariableAxes,
): VariableArtifactPlanItem[] => {
	const config = buildFontConfig(metadata, { formats: ['woff2'], axes });

	return resolveFontFaces(config).flatMap((face) => {
		const axisKey = face.axisKey;
		if (!axisKey) {
			return [];
		}

		return face.sources.flatMap((source) => {
			if (source.format !== 'woff2') {
				return [];
			}

			const filename = `${face.subset}-${axisKey.toLowerCase()}-${face.style}.woff2`;

			return {
				filename,
				sourceFilename: filename,
				archivePath: `variable/webfonts/${source.filename}`,
				buildMode: 'copy' as const,
				subset: face.subset,
				axisKey,
				style: face.style,
				extension: 'woff2' as const,
			} satisfies VariableArtifactPlanItem;
		});
	});
};
