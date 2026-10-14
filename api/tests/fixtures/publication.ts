import type { PackageOutputManifest } from '../../shared/package-output';
import type { RegistryFamilyDetail } from '../../shared/registry';

export const publishedPackages = {
	abel: { static: '5.0.0' },
	recursive: { static: '5.0.0', variable: '5.0.0' },
	'new-math': { static: '6.0.0' },
	'variable-only': { variable: '6.0.1' },
};
const source = '2'.repeat(64);
export const packageMetadata: RegistryFamilyDetail = {
	id: 'new-math',
	family: 'New Math',
	provider: 'other',
	status: 'active',
	classifications: ['serif'],
	tags: [],
	sourceModified: '2026-01-01',
	axes: [],
	languages: [],
	license: {
		id: 'OFL-1.1',
		url: 'https://openfontlicense.org',
		text: 'Test license',
	},
	provenance: { type: 'registry' },
	previewSource: source,
	distribution: {
		static: [{ weight: 400, style: 'normal', source }],
		characters: { type: 'all' },
	},
	sources: [
		{
			sha256: source,
			filename: 'Math.ttf',
			path: 'Math.ttf',
			format: 'ttf',
			size: 1,
			downloadUrl: `/v1/registry/sources/${source}`,
			capabilitiesUrl: `/v1/registry/sources/${source}/capabilities`,
			fontVersion: null,
			glyphCount: 1,
			codepointCount: 1,
			style: 'normal',
			type: 'static',
			weight: 400,
		},
	],
};
export const packageManifest: PackageOutputManifest = {
	schemaVersion: 1,
	family: 'New Math',
	sourceModified: '2026-01-01',
	faces: [
		{
			subset: 'full',
			weight: 400,
			style: 'normal',
			isVariable: false,
			sliceIndex: 0,
			unicodeRange: '',
			sources: [
				{ filename: 'new-math-full-400-normal.woff2', format: 'woff2' },
			],
		},
	],
	entrypoints: { 'index.css': [0], '400.css': [0] },
};

export const publishedFamilies = [
	['abel', 'Abel'],
	['recursive', 'Recursive'],
	['new-math', 'New Math'],
	['variable-only', 'Variable Only'],
].map(([id, family]) => ({
	id,
	family,
	provider: 'other',
	status: 'active',
	classifications: ['serif'],
	tags: [],
	sourceModified: '2026-01-01',
	axes: [],
}));
