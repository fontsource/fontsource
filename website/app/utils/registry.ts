import type {
	GetRegistryFamilyResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';

type RegistryFamily = GetRegistryFamilyResponse;
type RegistrySource = RegistryFamily['sources'][number];
type RegistryDataState = 'available' | 'not-found' | 'unavailable';
type UnicodeRange = readonly [number, number];
type RegistryFamilyKind = 'text' | 'symbols' | 'punctuation' | 'digital';

const maxUnicodeCodepoint = 0x10ffff;
const isUnicodeScalarValue = (value: number) =>
	Number.isInteger(value) &&
	value >= 0 &&
	value <= maxUnicodeCodepoint &&
	!(value >= 0xd800 && value <= 0xdfff);
const getUnicodeCharacter = (value: number) =>
	isUnicodeScalarValue(value) ? String.fromCodePoint(value) : undefined;

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

	return orderedLanguages;
};

const selectRegistryPreviewLanguage = (
	registry?: RegistryFamily,
	languages?: ListRegistryLanguagesResponse,
) => {
	const familyLanguages = selectRegistryFamilyLanguages(registry, languages);
	const languagesWithSamples = familyLanguages?.filter((language) =>
		language.sampleText?.short.trim(),
	);
	if (!languagesWithSamples?.length) return;

	return (
		languagesWithSamples.find(
			(language) => language.id === registry?.primaryLanguage,
		) ??
		languagesWithSamples.find(
			(language) => language.script === registry?.primaryScript,
		) ??
		languagesWithSamples[0]
	);
};

const getRegistryPreviewText = (
	registry?: RegistryFamily,
	languages?: ListRegistryLanguagesResponse,
	length: 'short' | 'long' = 'short',
) => {
	const familySample = registry?.sampleText;
	if (familySample) {
		return (
			(length === 'long' ? familySample.long : familySample.short)?.trim() ??
			familySample.short.trim()
		);
	}

	const languageSample = selectRegistryPreviewLanguage(
		registry,
		languages,
	)?.sampleText;
	return (
		(length === 'long'
			? languageSample?.long
			: languageSample?.short
		)?.trim() ?? languageSample?.short.trim()
	);
};

const parseRegistryUnicodeRange = (value: string): UnicodeRange[] =>
	value
		.split(',')
		.flatMap((range) => {
			const match = /^U\+([\dA-F]{1,6})(?:-([\dA-F]{1,6}))?$/iu.exec(
				range.trim(),
			);
			if (!match) return [];

			const start = Number.parseInt(match[1] ?? '', 16);
			const end = Number.parseInt(match[2] ?? match[1] ?? '', 16);
			if (start > end || start < 0 || end > maxUnicodeCodepoint) {
				return [];
			}
			return [[start, end] as const];
		})
		.sort((a, b) => a[0] - b[0]);

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
	!/^(\p{C}|\p{Z})$/u.test(character);

type RegistryCharacterGroups = Record<
	'all' | 'letters' | 'marks' | 'numbers' | 'punctuation' | 'symbols',
	string[]
>;

const getRegistryCharacterGroups = (
	capabilities?: GetRegistrySourceCapabilitiesResponse,
): RegistryCharacterGroups | undefined => {
	if (!capabilities) return;

	const groups: RegistryCharacterGroups = {
		all: [],
		letters: [],
		marks: [],
		numbers: [],
		punctuation: [],
		symbols: [],
	};
	for (const [start, end] of parseRegistryUnicodeRange(
		capabilities.unicodeRange,
	)) {
		for (let codepoint = start; codepoint <= end; codepoint += 1) {
			const character = getUnicodeCharacter(codepoint);
			if (!character) continue;
			if (!isBrowsableCharacter(character)) continue;
			groups.all.push(character);
			if (/^\p{L}$/u.test(character)) {
				groups.letters.push(character);
			} else if (/^\p{M}$/u.test(character)) {
				groups.marks.push(character);
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

const getRegistrySourcePreviewStyle = (source?: RegistrySource) => {
	if (!source) return {};

	return {
		fontStyle: source.declaredVariant?.style ?? source.style,
		fontWeight:
			source.declaredVariant?.weight ??
			(typeof source.weight === 'number'
				? source.weight
				: source.weight.default),
	};
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
	clig: 'Contextual ligatures',
	dlig: 'Discretionary ligatures',
	dnom: 'Denominators',
	frac: 'Fractions',
	kern: 'Kerning',
	liga: 'Standard ligatures',
	lnum: 'Lining figures',
	locl: 'Localized forms',
	mark: 'Mark positioning',
	mkmk: 'Mark-to-mark positioning',
	numr: 'Numerators',
	onum: 'Oldstyle figures',
	ordn: 'Ordinals',
	pnum: 'Proportional figures',
	rlig: 'Required ligatures',
	salt: 'Stylistic alternates',
	sinf: 'Scientific inferiors',
	smcp: 'Small capitals',
	subs: 'Subscript',
	sups: 'Superscript',
	tnum: 'Tabular figures',
	zero: 'Slashed zero',
};

const getOpenTypeFeatureName = (tag: string) => {
	if (/^ss\d{2}$/.test(tag)) {
		return `Stylistic set ${Number(tag.slice(2))}`;
	}
	if (/^cv\d{2}$/.test(tag)) {
		return `Character variant ${Number(tag.slice(2))}`;
	}
	return featureNames[tag] ?? tag.toUpperCase();
};

export type {
	RegistryDataState,
	RegistryFamily,
	RegistryFamilyKind,
	RegistrySource,
};
export {
	findUnmappedCharacters,
	getOpenTypeFeatureName,
	getRegistryCharacterGroups,
	getRegistryContent,
	getRegistryFamilyKind,
	getRegistryPreviewText,
	getRegistrySourcePreviewStyle,
	getUnicodeCharacter,
	selectRegistryFamilyLanguages,
	selectRegistryPreviewLanguage,
	usesNameLigatures,
};
