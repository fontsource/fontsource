import { describe, expect, it } from 'vitest';

import {
	isPinnedVersion,
	parseFontTag,
	resolveVersionTag,
} from '../worker/src/features/font-tag';
import { buildVersionResponse } from '../worker/src/features/metadata/store';

describe('font tag utilities', () => {
	it.each([
		['abel@latest', { id: 'abel', isVariable: false, version: 'latest' }],
		[
			'recursive:vf@5.2.3',
			{ id: 'recursive', isVariable: true, version: '5.2.3' },
		],
	])('parseFontTag(%s)', (input, expected) => {
		expect(parseFontTag(input)).toEqual(expected);
	});

	it.each([
		['abel@1.0.0@junk', 'Invalid font tag: malformed tag'],
		[
			'recursive:vf:extra@1.0.0',
			'Invalid font tag: unsupported variable suffix',
		],
		['abel@4.0.0', 'Bad Request. Version tags below @5 are not supported.'],
		['abel@4', 'Bad Request. Version tags below @5 are not supported.'],
	])('parseFontTag(%s) throws', (input, message) => {
		expect(() => parseFontTag(input)).toThrow(message);
	});

	const versions = ['v1.0.0', '1.2.0', '2.0.1'];

	it.each([
		['latest', '2.0.1'],
		['2', '2.0.1'],
		['1.2', '1.2.0'],
		['1.0.0', '1.0.0'],
	])('resolveVersionTag(%s) returns %s', (input, expected) => {
		expect(resolveVersionTag(input, versions)).toBe(expected);
	});

	it('builds sorted version payloads for the public API', () => {
		expect(
			buildVersionResponse(
				['1.0.0', '1.5.0', 'v1.2.0', '1.2.0', 'invalid'],
				['v2.0.0', '1.7.0', '1.7.0-alpha.1', 'invalid'],
			),
		).toEqual({
			latest: '1.5.0',
			static: ['1.5.0', '1.2.0', '1.0.0'],
			latestVariable: '2.0.0',
			variable: ['2.0.0', '1.7.0', '1.7.0-alpha.1'],
		});
	});

	it.each([
		['1.2.3', true],
		['v1.2.3', true],
		['1.2.3-beta.1', false],
		['1.2.3+meta', false],
		['1.2', false],
		['latest', false],
	] as const)('isPinnedVersion(%s) returns %s', (input, expected) => {
		expect(isPinnedVersion(input)).toBe(expected);
	});
});
