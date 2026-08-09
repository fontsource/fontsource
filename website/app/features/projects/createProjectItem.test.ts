import { describe, expect, it } from 'vitest';

import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetVariableFontResponse,
} from '@/generated/api';
import type { RegistryFamily } from '@/utils/registry';

import { resolveFontSetFamily } from './createProjectItem';

const metadata = {
	id: 'example',
	family: 'Example',
	weights: [400, 700],
	styles: ['normal', 'italic'],
	subsets: ['latin'],
	defSubset: 'latin',
	variable: true,
	lastModified: '2026-08-01',
	category: 'sans-serif',
	license: 'OFL-1.1',
	type: 'google',
	version: 'v1',
	source: 'https://example.com',
	unicodeRange: { latin: 'U+0000-00FF' },
	variants: {},
} satisfies GetFontResponse;

const versions = {
	latest: '5.3.0',
	static: ['5.3.0'],
	latestVariable: '5.3.0',
	variable: ['5.3.0'],
} satisfies GetFontVersionsResponse;

const variable = {
	family: 'Example',
	axes: {
		wght: { min: '100', max: '900', default: '400', step: '1' },
	},
} satisfies GetVariableFontResponse;

describe('resolveFontSetFamily', () => {
	it('uses the variable package and its default weight axis', () => {
		const item = resolveFontSetFamily({ metadata, versions, variable });

		expect(item).toMatchObject({
			format: 'variable',
			packageName: '@fontsource-variable/example',
			cssFile: 'wght.css',
			axes: { wght: 400 },
		});
	});

	it('uses a regular static face when the family is static-only', () => {
		const item = resolveFontSetFamily({
			metadata: { ...metadata, variable: false },
			versions: { latest: '5.3.0', static: ['5.3.0'] },
		});

		expect(item).toMatchObject({
			format: 'static',
			packageName: '@fontsource/example',
			cssFile: '400.css',
			axes: {},
		});
	});

	it('uses the full variable stylesheet for multi-axis symbol families', () => {
		const registry = {
			displayName: 'Example Symbols',
			classifications: ['symbols'],
			tags: ['special-use/icons'],
			status: 'active',
			license: {
				id: 'Apache-2.0',
				url: 'https://www.apache.org/licenses/LICENSE-2.0',
			},
			symbols: {
				catalogUrl: '/v1/registry/families/example/symbols',
				inputModes: ['codepoint', 'name-ligature'],
			},
		} as RegistryFamily;
		const item = resolveFontSetFamily({
			metadata: { ...metadata, category: 'icons' },
			versions,
			variable: {
				...variable,
				axes: {
					...variable.axes,
					FILL: { min: '0', max: '1', default: '0', step: '1' },
				},
			},
			registry,
		});

		expect(item).toMatchObject({
			displayName: 'Example Symbols',
			cssFile: 'full.css',
			symbolInputModes: ['codepoint', 'name-ligature'],
		});
	});
});
