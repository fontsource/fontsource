import { expect, it } from 'vitest';
import { createLanguageMatcher } from './languages.ts';
import { languageCatalogSchema } from './schema.ts';

it('reports only languages supported by every source face', () => {
	const matchLanguages = createLanguageMatcher(
		languageCatalogSchema.parse({
			en_Latn: {
				language: 'en',
				script: 'Latn',
				name: 'English',
				requiredCodepoints: [65, 66],
			},
			el_Grek: {
				language: 'el',
				script: 'Grek',
				name: 'Greek',
				requiredCodepoints: [913],
			},
		}),
	);

	expect(
		matchLanguages([
			{ cmapSha256: 'first', unicodeRanges: [[65, 66], 913] },
			{ cmapSha256: 'second', unicodeRanges: [[65, 66]] },
		]),
	).toEqual(['en_Latn']);
});
