import type { AxisRegistry } from '../../shared/axis-registry';
import type {
	FontCatalog,
	SourceFontMetadata,
	VariableAxes,
} from '../../shared/catalog';

export const testCatalog: FontCatalog = {
	abel: {
		id: 'abel',
		family: 'Abel',
		subsets: ['latin'],
		weights: [400],
		styles: ['normal'],
		defSubset: 'latin',
		variable: false,
		lastModified: '2024-01-01',
		version: 'v1',
		category: 'sans-serif',
		license: {
			type: 'OFL-1.1',
			url: 'https://example.com/ofl',
			attribution: 'Example',
		},
		source: 'https://example.com',
		type: 'google',
		unicodeRange: {
			latin: 'U+0000-00FF',
		},
	},
	recursive: {
		id: 'recursive',
		family: 'Recursive',
		subsets: ['latin'],
		weights: [400],
		styles: ['normal'],
		defSubset: 'latin',
		variable: {
			MONO: {
				default: '0',
				min: '0',
				max: '1',
				step: '1',
			},
		},
		lastModified: '2024-01-02',
		version: 'v1',
		category: 'sans-serif',
		license: {
			type: 'OFL-1.1',
			url: 'https://example.com/ofl',
			attribution: 'Example',
		},
		source: 'https://example.com',
		type: 'google',
		unicodeRange: {
			latin: 'U+0000-00FF',
		},
	},
	familypack: {
		id: 'familypack',
		family: 'Family Pack',
		subsets: ['latin', 'latin-ext'],
		weights: [400, 700],
		styles: ['normal'],
		defSubset: 'latin',
		variable: false,
		lastModified: '2024-01-03',
		version: 'v1',
		category: 'sans-serif',
		license: {
			type: 'OFL-1.1',
			url: 'https://example.com/ofl',
			attribution: 'Example',
		},
		source: 'https://example.com',
		type: 'google',
		unicodeRange: {
			latin: 'U+0000-00FF',
			'latin-ext': 'U+0100-024F',
		},
	},
};

export const scheduledCatalog = {
	abel: testCatalog.abel,
} satisfies FontCatalog;

export const staticMetadata: SourceFontMetadata = testCatalog.abel;
export const variableMetadata: SourceFontMetadata = testCatalog.recursive;
export const variableAxes = testCatalog.recursive.variable as VariableAxes;

export const testAxisRegistry: AxisRegistry = {
	MONO: {
		name: 'Monospace',
		description: 'Monospace axis',
		min: 0,
		max: 1,
		default: 0,
		precision: 1,
	},
};

export const scheduledAxisRegistry = [
	{
		tag: 'MONO',
		name: 'Monospace',
		description: 'Monospace axis',
		min: 0,
		max: 1,
		default: 0,
		precision: 1,
	},
];

export const testVersions = {
	abel: {
		latest: '5.0.0',
		static: ['5.0.0'],
	},
	recursive: {
		latest: '5.0.0',
		static: ['5.0.0'],
		latestVariable: '5.0.0',
		variable: ['5.0.0'],
	},
	familypack: {
		latest: '5.0.0',
		static: ['5.0.0'],
	},
};
