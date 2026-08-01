import type {
	GetRegistryFamilyResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';

type RegistryFamily = GetRegistryFamilyResponse;
type RegistrySource = RegistryFamily['sources'][number];
type UnicodeRange = readonly [number, number];
type RegistryFamilyKind = 'text' | 'symbols' | 'punctuation' | 'digital';

const usesNameLigatures = (registry?: RegistryFamily) =>
	registry?.symbols?.inputModes.includes('name-ligature') ?? false;

const getRegistryFamilyKind = (
	registry?: RegistryFamily,
): RegistryFamilyKind => {
	if (registry?.tags.includes('special-use/punctuation')) return 'punctuation';
	if (registry?.tags.includes('special-use/digital-display')) return 'digital';
	if (registry?.symbols || registry?.classifications.includes('symbols')) {
		return 'symbols';
	}
	return 'text';
};

const getRegistryContent = (registry?: RegistryFamily) => {
	const entries = Object.entries(registry?.content ?? {});
	return (
		entries.find(([locale]) => locale.toLowerCase().startsWith('en'))?.[1] ??
		entries[0]?.[1]
	);
};

const selectRegistryFamilyLanguages = (
	registry?: RegistryFamily,
	languages?: ListRegistryLanguagesResponse,
	limit = 12,
) => {
	if (!registry || !languages) return;

	const familyLanguageIds = new Set(registry.languages);
	const familyLanguages = languages.filter((language) =>
		familyLanguageIds.has(language.id),
	);
	const primaryLanguage = familyLanguages.find(
		(language) => language.id === registry.primaryLanguage,
	);
	const orderedLanguages = primaryLanguage
		? [
				primaryLanguage,
				...familyLanguages.filter(
					(language) => language.id !== primaryLanguage.id,
				),
			]
		: familyLanguages;

	return orderedLanguages.slice(0, limit);
};

const parseRegistryUnicodeRange = (value: string): UnicodeRange[] =>
	value.split(/,\s*/).map((range) => {
		const [startValue, endValue = startValue] = range.slice(2).split('-');
		const start = Number.parseInt(startValue ?? '', 16);
		const end = Number.parseInt(endValue ?? '', 16);
		return [start, end] as const;
	});

const includesCodepoint = (ranges: readonly UnicodeRange[], value: number) => {
	let lower = 0;
	let upper = ranges.length - 1;

	while (lower <= upper) {
		const middle = Math.floor((lower + upper) / 2);
		const range = ranges[middle];
		if (!range) return false;
		if (value < range[0]) {
			upper = middle - 1;
		} else if (value > range[1]) {
			lower = middle + 1;
		} else {
			return true;
		}
	}

	return false;
};

const isBrowsableCharacter = (character: string) =>
	!/^(\p{Cc}|\p{Cf}|\p{Cs}|\p{Cn}|\p{Z})$/u.test(character);

type RegistryCharacterGroups = Record<
	'all' | 'letters' | 'numbers' | 'punctuation' | 'symbols',
	string[]
>;

const getRegistryCharacterGroups = (
	capabilities?: GetRegistrySourceCapabilitiesResponse,
): RegistryCharacterGroups | undefined => {
	if (!capabilities) return;

	const groups: RegistryCharacterGroups = {
		all: [],
		letters: [],
		numbers: [],
		punctuation: [],
		symbols: [],
	};
	for (const [start, end] of parseRegistryUnicodeRange(
		capabilities.unicodeRange,
	)) {
		for (let codepoint = start; codepoint <= end; codepoint += 1) {
			const character = String.fromCodePoint(codepoint);
			if (!isBrowsableCharacter(character)) continue;
			groups.all.push(character);
			if (/^(\p{L}|\p{M})$/u.test(character)) {
				groups.letters.push(character);
			} else if (/^\p{N}$/u.test(character)) {
				groups.numbers.push(character);
			} else if (/^\p{P}$/u.test(character)) {
				groups.punctuation.push(character);
			} else if (/^\p{S}$/u.test(character)) {
				groups.symbols.push(character);
			}
		}
	}

	return groups;
};

const findUnmappedCharacters = (
	value: string,
	capabilities?: GetRegistrySourceCapabilitiesResponse,
): string[] => {
	if (!capabilities) return [];
	const ranges = parseRegistryUnicodeRange(capabilities.unicodeRange);

	return Array.from(
		new Set(
			Array.from(value).filter(
				(character) =>
					isBrowsableCharacter(character) &&
					!includesCodepoint(ranges, character.codePointAt(0) ?? 0),
			),
		),
	);
};

const featureNames: Record<string, string> = {
	aalt: 'Access all alternates',
	calt: 'Contextual alternates',
	case: 'Case-sensitive forms',
	ccmp: 'Glyph composition',
	dlig: 'Discretionary ligatures',
	frac: 'Fractions',
	kern: 'Kerning',
	liga: 'Standard ligatures',
	locl: 'Localized forms',
	mark: 'Mark positioning',
	mkmk: 'Mark-to-mark positioning',
	onum: 'Oldstyle figures',
	pnum: 'Proportional figures',
	salt: 'Stylistic alternates',
	smcp: 'Small capitals',
	ss01: 'Stylistic set 1',
	ss02: 'Stylistic set 2',
	ss03: 'Stylistic set 3',
	ss04: 'Stylistic set 4',
	ss05: 'Stylistic set 5',
	sub: 'Subscript',
	sups: 'Superscript',
	tnum: 'Tabular figures',
};

const getOpenTypeFeatureName = (tag: string) =>
	featureNames[tag] ?? tag.toUpperCase();

export type { RegistryFamily, RegistryFamilyKind, RegistrySource };
export {
	findUnmappedCharacters,
	getOpenTypeFeatureName,
	getRegistryCharacterGroups,
	getRegistryContent,
	getRegistryFamilyKind,
	selectRegistryFamilyLanguages,
	usesNameLigatures,
};
