import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';

import {
	createFontSetArchive,
	type FontSetArchiveError,
} from './downloadFontSet';
import type { ProjectItem } from './model';

const projectItem = (familyId = 'roboto'): ProjectItem => ({
	familyId,
	family: 'Roboto',
	displayName: 'Roboto',
	category: 'sans-serif',
	classification: 'sans-serif',
	tags: [],
	status: 'active',
	registryFactsCurrent: true,
	format: 'static',
	subset: 'latin',
	style: 'normal',
	weight: 400,
	styles: ['normal', 'italic'],
	weights: [400, 700],
	axes: {},
	packageName: '@fontsource/roboto',
	packageVersion: '5.3.0',
	cssFile: 'latin-400.css',
	cssFiles: ['latin-400.css', 'latin-700-italic.css'],
	fontFamily: 'Roboto',
	sampleText: 'Every letter has a point of view.',
	symbolInputModes: [],
	license: { verified: true, id: 'OFL-1.1' },
});

const sourceArchive = zipSync({
	'../outside.txt': strToU8('safe'),
	'web/font.woff2': strToU8('font data'),
});

describe('font set archive', () => {
	it('organizes families safely and includes exact combined CSS', async () => {
		const progress = vi.fn();
		const blob = await createFontSetArchive(
			[projectItem('../../roboto')],
			progress,
			{
				getFamilyArchive: async () => sourceArchive,
			},
		);
		const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()));

		expect(Object.keys(archive).sort()).toEqual([
			'fontsource-font-set.css',
			'roboto/outside.txt',
			'roboto/web/font.woff2',
		]);
		expect(strFromU8(archive['fontsource-font-set.css'])).toContain(
			'@fontsource/roboto@5.3.0/latin-700-italic.css',
		);
		expect(progress).toHaveBeenCalledWith(1);
	});

	it('rejects sets that exceed the browser safety boundary', async () => {
		await expect(
			createFontSetArchive([projectItem()], () => undefined, {
				getFamilyArchive: async () => sourceArchive,
				maxExpandedBytes: 1,
			}),
		).rejects.toMatchObject({
			code: 'too-large',
		} satisfies Partial<FontSetArchiveError>);
	});

	it('rejects corrupt or incomplete family archives', async () => {
		await expect(
			createFontSetArchive([projectItem()], () => undefined, {
				getFamilyArchive: async () => new Uint8Array([1, 2, 3]),
			}),
		).rejects.toBeDefined();

		const progress = vi.fn();
		await expect(
			createFontSetArchive(
				[projectItem('roboto'), projectItem('inter')],
				progress,
				{
					getFamilyArchive: async (familyId) => {
						if (familyId === 'inter') throw new Error('network failed');
						return sourceArchive;
					},
				},
			),
		).rejects.toThrow('network failed');
		expect(progress).toHaveBeenCalledTimes(1);
	});
});
