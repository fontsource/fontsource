import type { ConversionResult } from '@fontsource-utils/core';
import { describe, expect, it } from 'vitest';
import { resolveConversionArtifacts } from './artifacts';

const result = (
	filename: string,
	format: ConversionResult['format'],
): ConversionResult => ({
	filename,
	format,
	data: new Uint8Array([1]),
});

describe('resolveConversionArtifacts', () => {
	it('preserves unique output filenames', () => {
		const resolved = resolveConversionArtifacts([
			{
				sourceId: 7,
				results: [
					result('heading.woff2', 'woff2'),
					result('heading.woff', 'woff'),
				],
			},
		]);

		expect(resolved.renamedArtifactCount).toBe(0);
		expect(
			resolved.artifacts.map(({ filename, sourceId }) => ({
				filename,
				sourceId,
			})),
		).toEqual([
			{ filename: 'heading.woff2', sourceId: 7 },
			{ filename: 'heading.woff', sourceId: 7 },
		]);
	});

	it('keeps every source and gives colliding output sets one suffix', () => {
		const resolved = resolveConversionArtifacts([
			{
				sourceId: 1,
				results: [result('font.woff2', 'woff2'), result('font.woff', 'woff')],
			},
			{
				sourceId: 2,
				results: [result('font.woff2', 'woff2'), result('font.woff', 'woff')],
			},
			{
				sourceId: 3,
				results: [result('font.woff2', 'woff2')],
			},
		]);

		expect(resolved.renamedArtifactCount).toBe(3);
		expect(resolved.artifacts.map(({ filename }) => filename)).toEqual([
			'font.woff2',
			'font.woff',
			'font-2.woff2',
			'font-2.woff',
			'font-3.woff2',
		]);
	});

	it('treats case-only filename differences as collisions', () => {
		const resolved = resolveConversionArtifacts([
			{
				sourceId: 1,
				results: [result('Font.woff2', 'woff2')],
			},
			{
				sourceId: 2,
				results: [result('font.woff2', 'woff2')],
			},
		]);

		expect(resolved.artifacts.map(({ filename }) => filename)).toEqual([
			'Font.woff2',
			'font-2.woff2',
		]);
	});
});
