import { Buffer } from 'node:buffer';
import { RegistryLanguageIndexSchema } from '../../api/shared/registry.ts';
import { compareStrings, sha256 } from './shared.ts';

export const createLanguageIndex = (
	families: { id: string; languages: string[] }[],
	languageIds: string[],
) => {
	const sortedFamilies = families.toSorted((left, right) =>
		compareStrings(left.id, right.id),
	);
	const languageBits = Object.fromEntries(
		languageIds
			.toSorted(compareStrings)
			.map((id) => [id, Buffer.alloc(Math.ceil(sortedFamilies.length / 8))]),
	);
	for (const [index, family] of sortedFamilies.entries()) {
		for (const language of family.languages) {
			languageBits[language][index >> 3] |= 1 << (index % 8);
		}
	}
	return RegistryLanguageIndexSchema.parse({
		version: sha256(
			JSON.stringify(
				sortedFamilies.map(({ id, languages }) => [id, languages.toSorted()]),
			),
		),
		families: sortedFamilies.map(({ id }) => id),
		languages: Object.fromEntries(
			Object.entries(languageBits).map(([id, bits]) => [
				id,
				bits.toString('base64'),
			]),
		),
	});
};
