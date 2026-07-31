import type {
	GetFontResponse,
	GetRegistryFamilyResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';

type RegistrySource = GetRegistryFamilyResponse['sources'][number];
type UnicodeRange = readonly [number, number];
type FamilyIdentity = Pick<GetFontResponse, 'category' | 'id'>;

const isIconFontFamily = (
	metadata: FamilyIdentity,
	registry?: GetRegistryFamilyResponse,
) =>
	Boolean(registry?.symbolsUrl) ||
	Boolean(registry?.tags.includes('special-use/icons')) ||
	metadata.category === 'icons';

const isPunctuationFontFamily = (
	metadata: FamilyIdentity,
	registry?: GetRegistryFamilyResponse,
) =>
	Boolean(registry?.tags.includes('special-use/punctuation')) ||
	metadata.id.startsWith('yakuhan');

const isDigitalFontFamily = (
	metadata: FamilyIdentity,
	registry?: GetRegistryFamilyResponse,
) =>
	Boolean(registry?.tags.includes('special-use/digital-display')) ||
	metadata.id.startsWith('dseg');

const sourceByHash = (
	registry: GetRegistryFamilyResponse,
	sha256?: string,
): RegistrySource | undefined =>
	sha256
		? registry.sources.find((source) => source.sha256 === sha256)
		: undefined;

const selectRegistrySource = (
	registry?: GetRegistryFamilyResponse,
): RegistrySource | undefined => {
	if (!registry) return;

	const variable = registry.distribution?.variable ?? [];
	const staticVariants = registry.distribution?.static ?? [];
	const preferredHashes = [
		variable.find(
			(variant) => variant.style === 'normal' && variant.axisKey === 'standard',
		)?.source,
		variable.find(
			(variant) => variant.style === 'normal' && variant.axisKey === 'full',
		)?.source,
		variable.find(
			(variant) => variant.style === 'normal' && variant.axisKey === 'wght',
		)?.source,
		variable.find((variant) => variant.style === 'normal')?.source,
		staticVariants.find(
			(variant) => variant.style === 'normal' && variant.weight === 400,
		)?.source,
		staticVariants.find((variant) => variant.style === 'normal')?.source,
		variable[0]?.source,
		staticVariants[0]?.source,
	];

	for (const sha256 of preferredHashes) {
		const source = sourceByHash(registry, sha256);
		if (source) return source;
	}

	return (
		registry.sources.find(
			(source) => source.type === 'variable' && source.style === 'normal',
		) ??
		registry.sources.find(
			(source) =>
				source.type === 'static' &&
				source.style === 'normal' &&
				source.weight === 400,
		) ??
		registry.sources[0]
	);
};

const selectRegistryFamilyLanguages = (
	registry?: GetRegistryFamilyResponse,
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
	value.split(', ').map((range) => {
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
interface RegistryCharacterCatalog {
	groups: RegistryCharacterGroups;
	truncated: boolean;
}

const MAX_BROWSABLE_CODEPOINTS = 4096;

const getRegistryCharacterGroups = (
	capabilities?: GetRegistrySourceCapabilitiesResponse,
): RegistryCharacterCatalog | undefined => {
	if (!capabilities) return;

	const groups: RegistryCharacterGroups = {
		all: [],
		letters: [],
		numbers: [],
		punctuation: [],
		symbols: [],
	};
	let inspectedCodepoints = 0;
	let truncated = false;

	outer: for (const [start, end] of parseRegistryUnicodeRange(
		capabilities.unicodeRange,
	)) {
		for (let codepoint = start; codepoint <= end; codepoint += 1) {
			if (inspectedCodepoints >= MAX_BROWSABLE_CODEPOINTS) {
				truncated = true;
				break outer;
			}
			inspectedCodepoints += 1;
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

	return { groups, truncated };
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

export type {
	RegistryCharacterCatalog,
	RegistryCharacterGroups,
	RegistrySource,
	UnicodeRange,
};
export {
	findUnmappedCharacters,
	getOpenTypeFeatureName,
	getRegistryCharacterGroups,
	isDigitalFontFamily,
	isIconFontFamily,
	isPunctuationFontFamily,
	parseRegistryUnicodeRange,
	selectRegistryFamilyLanguages,
	selectRegistrySource,
};
