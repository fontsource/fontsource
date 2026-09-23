import { strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { createFontSetArchive } from './downloadFontSet';

const font = (familyId = 'roboto') => ({ familyId });

const sourceArchive = zipSync({
	'../outside.txt': strToU8('safe'),
	'web/font.woff2': strToU8('font data'),
});

describe('font set archive', () => {
	it('organizes complete family archives safely', async () => {
		const blob = await createFontSetArchive(
			[font('../../roboto')],
			() => undefined,
			{
				getFamilyArchive: async () => sourceArchive,
			},
		);
		const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()));

		expect(Object.keys(archive).sort()).toEqual([
			'roboto/outside.txt',
			'roboto/web/font.woff2',
		]);
	});

	it('rejects incomplete family archives', async () => {
		await expect(
			createFontSetArchive([font('roboto'), font('inter')], () => undefined, {
				getFamilyArchive: async (familyId) => {
					if (familyId === 'inter') throw new Error('network failed');
					return sourceArchive;
				},
			}),
		).rejects.toThrow('network failed');
	});
});
