import { strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';

import {
	createFontSetArchive,
	type FontSetArchiveError,
} from './downloadFontSet';

const font = (familyId = 'roboto') => ({ familyId });

const sourceArchive = zipSync({
	'../outside.txt': strToU8('safe'),
	'web/font.woff2': strToU8('font data'),
});

describe('font set archive', () => {
	it('organizes complete family archives safely', async () => {
		const progress = vi.fn();
		const blob = await createFontSetArchive([font('../../roboto')], progress, {
			getFamilyArchive: async () => sourceArchive,
		});
		const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()));

		expect(Object.keys(archive).sort()).toEqual([
			'roboto/outside.txt',
			'roboto/web/font.woff2',
		]);
		expect(progress).toHaveBeenCalledWith(1);
	});

	it('rejects sets that exceed the browser safety boundary', async () => {
		await expect(
			createFontSetArchive([font()], () => undefined, {
				getFamilyArchive: async () => sourceArchive,
				maxExpandedBytes: 1,
			}),
		).rejects.toMatchObject({
			code: 'too-large',
		} satisfies Partial<FontSetArchiveError>);
	});

	it('rejects corrupt or incomplete family archives', async () => {
		await expect(
			createFontSetArchive([font()], () => undefined, {
				getFamilyArchive: async () => new Uint8Array([1, 2, 3]),
			}),
		).rejects.toBeDefined();

		const progress = vi.fn();
		await expect(
			createFontSetArchive([font('roboto'), font('inter')], progress, {
				getFamilyArchive: async (familyId) => {
					if (familyId === 'inter') throw new Error('network failed');
					return sourceArchive;
				},
			}),
		).rejects.toThrow('network failed');
		expect(progress).toHaveBeenCalledTimes(1);
	});
});
