import type {
	GetRegistryFamilyResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';

type RegistrySymbolInputMode = 'codepoint' | 'name-ligature';
type RegistryFamily = Omit<
	GetRegistryFamilyResponse,
	'distribution' | 'license'
> & {
	license: Omit<GetRegistryFamilyResponse['license'], 'text'> & {
		text: string;
	};
	distribution: NonNullable<GetRegistryFamilyResponse['distribution']>;
	symbols?: {
		catalogUrl: string;
		inputModes: RegistrySymbolInputMode[];
	};
};
type RegistrySource = RegistryFamily['sources'][number];
type UnicodeRange = readonly [number, number];

const validateRegistryFamily = (
	family: GetRegistryFamilyResponse,
): RegistryFamily | undefined => {
	const candidate = family as GetRegistryFamilyResponse & {
		symbols?: unknown;
	};
	if (!candidate.distribution || !candidate.license.text?.trim()) return;

	if (candidate.symbols !== undefined) {
		if (
			typeof candidate.symbols !== 'object' ||
			candidate.symbols === null ||
			!('catalogUrl' in candidate.symbols) ||
			typeof candidate.symbols.catalogUrl !== 'string' ||
			!candidate.symbols.catalogUrl ||
			!('inputModes' in candidate.symbols) ||
			!Array.isArray(candidate.symbols.inputModes) ||
			candidate.symbols.inputModes.length === 0 ||
			!candidate.symbols.inputModes.every(
				(mode) => mode === 'codepoint' || mode === 'name-ligature',
			)
		) {
			return;
		}
	}

	return candidate as RegistryFamily;
};

const hasRegistryTag = (registry: RegistryFamily | undefined, tag: string) =>
	registry?.tags.includes(tag) ?? false;

const hasSymbolCatalog = (registry?: RegistryFamily) =>
	Boolean(registry?.symbols);

const isSymbolFontFamily = (registry?: RegistryFamily) =>
	registry?.classifications.includes('symbols') ?? false;

const usesNameLigatures = (registry?: RegistryFamily) =>
	registry?.symbols?.inputModes.includes('name-ligature') ?? false;

const isPunctuationFontFamily = (registry?: RegistryFamily) =>
	hasRegistryTag(registry, 'special-use/punctuation');

const isDigitalFontFamily = (registry?: RegistryFamily) =>
	hasRegistryTag(registry, 'special-use/digital-display');

const sourceByHash = (
	registry: RegistryFamily,
	sha256?: string,
): RegistrySource | undefined =>
	sha256
		? registry.sources.find((source) => source.sha256 === sha256)
		: undefined;

interface RegistrySourceSelection {
	format: 'static' | 'variable';
	style: 'normal' | 'italic';
	weight?: number;
}

const selectRegistryDistributionSource = (
	registry: RegistryFamily | undefined,
	selection: RegistrySourceSelection,
): RegistrySource | undefined => {
	if (!registry) return;

	const variable = registry.distribution.variable ?? [];
	const staticVariants = registry.distribution.static ?? [];
	const selectedVariable =
		variable.find(
			(variant) =>
				variant.style === selection.style && variant.axisKey === 'standard',
		) ?? variable.find((variant) => variant.style === selection.style);
	const selectedStatic =
		staticVariants.find(
			(variant) =>
				variant.style === selection.style &&
				variant.weight === (selection.weight ?? 400),
		) ?? staticVariants.find((variant) => variant.style === selection.style);
	const preferredHashes =
		selection.format === 'variable'
			? [selectedVariable?.source]
			: [selectedStatic?.source];

	for (const sha256 of preferredHashes) {
		const source = sourceByHash(registry, sha256);
		if (source) return source;
	}

	return;
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
	RegistryFamily,
	RegistrySource,
	RegistrySourceSelection,
	RegistrySymbolInputMode,
	UnicodeRange,
};
export {
	findUnmappedCharacters,
	getOpenTypeFeatureName,
	getRegistryCharacterGroups,
	hasRegistryTag,
	hasSymbolCatalog,
	isDigitalFontFamily,
	isPunctuationFontFamily,
	isSymbolFontFamily,
	parseRegistryUnicodeRange,
	selectRegistryDistributionSource,
	selectRegistryFamilyLanguages,
	usesNameLigatures,
	validateRegistryFamily,
};
