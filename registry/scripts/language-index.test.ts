import { describe, expect, it } from 'vitest';
import { RegistryLanguageIndexSchema } from '../../api/shared/registry.ts';
import { createLanguageIndex } from './language-index.ts';

describe('language index archive', () => {
	it('encodes every family across byte boundaries, including empty catalog languages', () => {
		const families = Array.from({ length: 10 }, (_, index) => ({
			id: `font-${index}`,
			languages: [0, 7, 8, 9].includes(index) ? ['en_Latn'] : [],
		}));
		const result = createLanguageIndex(families, ['en_Latn', 'peo_Xpeo']);
		expect(result.families).toEqual(families.map(({ id }) => id));
		expect([...Buffer.from(result.languages.en_Latn, 'base64')]).toEqual([
			129, 3,
		]);
		expect([...Buffer.from(result.languages.peo_Xpeo, 'base64')]).toEqual([
			0, 0,
		]);
		expect(
			createLanguageIndex(families.toReversed(), ['peo_Xpeo', 'en_Latn']),
		).toEqual(result);
	});

	it('fingerprints membership independently of input and catalog order', () => {
		const families = [
			{ id: 'beta', languages: [] },
			{ id: 'alpha', languages: ['peo_Xpeo', 'en_Latn'] },
		];
		const result = createLanguageIndex(families, ['en_Latn', 'peo_Xpeo']);
		expect(result.version).toBe(
			'afa5266952cc613b4d584f52f1f1cd348956aafadf9580223a668161ff8a8efa',
		);
		expect(
			createLanguageIndex(
				[
					{ id: 'alpha', languages: ['en_Latn', 'peo_Xpeo'] },
					{ id: 'beta', languages: [] },
				],
				['peo_Xpeo', 'en_Latn', 'fr_Latn'],
			).version,
		).toBe(result.version);
		expect(
			createLanguageIndex(
				[{ id: 'beta', languages: ['en_Latn'] }, families[1]],
				['en_Latn', 'peo_Xpeo'],
			).version,
		).not.toBe(result.version);
	});

	it('rejects malformed or incorrectly sized bitsets', () => {
		for (const bits of ['?', 'AQ', 'AQI=', '']) {
			expect(
				RegistryLanguageIndexSchema.safeParse({
					version: 'a'.repeat(64),
					families: ['abel'],
					languages: { en_Latn: bits },
				}).success,
			).toBe(false);
		}
	});
});
