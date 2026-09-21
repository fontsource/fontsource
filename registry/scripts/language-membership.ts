import { Buffer } from 'node:buffer';
import { RegistryLanguageMembershipSchema } from '../../api/shared/registry.ts';
import { compareStrings, sha256 } from './shared.ts';

export const createLanguageMembership = (
	families: { id: string; languages: string[] }[],
	languageIds: string[],
) => {
	const sorted = families.toSorted((left, right) =>
		compareStrings(left.id, right.id),
	);
	const languages = Object.fromEntries(
		languageIds
			.toSorted(compareStrings)
			.map((id) => [id, Buffer.alloc(Math.ceil(sorted.length / 8))]),
	);
	for (const [index, family] of sorted.entries()) {
		for (const language of family.languages) {
			languages[language][index >> 3] |= 1 << (index % 8);
		}
	}
	return RegistryLanguageMembershipSchema.parse({
		version: sha256(
			JSON.stringify(
				sorted.map(({ id, languages }) => [id, languages.toSorted()]),
			),
		),
		families: sorted.map(({ id }) => id),
		languages: Object.fromEntries(
			Object.entries(languages).map(([id, bits]) => [
				id,
				bits.toString('base64'),
			]),
		),
	});
};
