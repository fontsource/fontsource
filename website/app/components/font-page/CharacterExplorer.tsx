import { useClipboard } from '@mantine/hooks';
import {
	type KeyboardEvent,
	useDeferredValue,
	useEffect,
	useMemo,
	useState,
} from 'react';

import { IconCopy, IconSearch } from '@/components/icons';
import type {
	GetFontResponse,
	GetRegistryFamilyResponse,
	GetRegistryFamilySymbolsResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import {
	getFontFamilyStack,
	getPreferredPreviewSubset,
	getPreviewDirection,
	isLatinPreviewSubset,
} from '@/utils/font-preview';
import { getPreviewText as getLanguagePreviewText } from '@/utils/language/language';
import {
	findUnmappedCharacters,
	getRegistryCharacterGroups,
	isDigitalFontFamily,
	isIconFontFamily,
	isPunctuationFontFamily,
	type RegistrySource,
} from '@/utils/registry';

import classes from './CharacterExplorer.module.css';

interface CharacterExplorerProps {
	metadata: GetFontResponse;
	staticCSS: string;
	variableCSS?: string;
	registry?: GetRegistryFamilyResponse;
	languages?: ListRegistryLanguagesResponse;
	symbols?: GetRegistryFamilySymbolsResponse;
	capabilities?: GetRegistrySourceCapabilitiesResponse;
	capabilitySource?: RegistrySource;
	registryUnavailable?: boolean;
	capabilitiesUnavailable?: boolean;
	symbolsUnavailable?: boolean;
}

const characterGroups = {
	latin: [
		...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		...'abcdefghijklmnopqrstuvwxyz',
		...'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØŒÙÚÛÜÝàáâãäåæçèéêëìíîïñòóôõöøœùúûüýÿ',
		'fi',
		'fl',
		'ffi',
		'ffl',
	],
	punctuation: [...'.,;:!?()[]{}<>/\\|–—“”‘’…'],
	numbers: [...'0123456789'],
	symbols: [...'&@#%‰*+−=≠≤≥×÷€£¥$¢©®™§¶←→↑↓'],
} as const;

type ExplorerMode = 'browse' | 'check';

const characterGroupLabels = [
	{ label: 'Latin', value: 'latin' },
	{ label: 'Punctuation', value: 'punctuation' },
	{ label: 'Numbers', value: 'numbers' },
	{ label: 'Symbols', value: 'symbols' },
];

const registryCharacterGroupLabels = [
	{ label: 'All', value: 'all' },
	{ label: 'Letters', value: 'letters' },
	{ label: 'Numbers', value: 'numbers' },
	{ label: 'Punctuation', value: 'punctuation' },
	{ label: 'Symbols', value: 'symbols' },
] as const;

const iconGroups = {
	common: [
		'home',
		'search',
		'favorite',
		'menu',
		'close',
		'settings',
		'star',
		'check',
		'info',
		'warning',
		'visibility',
		'lock',
		'calendar_month',
		'schedule',
		'location_on',
		'language',
		'account_circle',
		'more_vert',
	],
	navigation: [
		'arrow_back',
		'arrow_forward',
		'expand_more',
		'chevron_left',
		'chevron_right',
		'open_in_new',
		'arrow_upward',
		'arrow_downward',
		'first_page',
		'last_page',
		'fullscreen',
		'fullscreen_exit',
	],
	actions: [
		'add',
		'delete',
		'edit',
		'download',
		'upload',
		'share',
		'refresh',
		'filter_list',
		'sort',
		'print',
		'content_copy',
		'undo',
	],
	communication: [
		'mail',
		'call',
		'chat',
		'notifications',
		'person',
		'group',
		'send',
		'forum',
		'contacts',
		'public',
		'campaign',
		'notifications_off',
	],
};

const iconGroupLabels = [
	{ label: 'Common', value: 'common' },
	{ label: 'Navigation', value: 'navigation' },
	{ label: 'Actions', value: 'actions' },
	{ label: 'Communication', value: 'communication' },
	{ label: 'All symbols', value: 'all' },
];

const japanesePunctuationGroups = {
	punctuation: ['、', '。', '，', '．', '・', '：', '；', '！', '？'],
	brackets: ['「', '」', '『', '』', '（', '）', '［', '］', '【', '】'],
	marks: ['…', '‥', 'ー', '〜', '〝', '〟', '々', '〆', '〇'],
	latin: [...'.,:;!?()[]'],
};

const japanesePunctuationLabels = [
	{ label: 'Japanese', value: 'punctuation' },
	{ label: 'Brackets', value: 'brackets' },
	{ label: 'Marks', value: 'marks' },
	{ label: 'Latin', value: 'latin' },
];

const digitalGroups = {
	numbers: [...'0123456789'],
	readouts: ['12:48', '36.90', '88:88', '24°C'],
	punctuation: [...':.-+/'],
	labels: ['AM', 'PM', 'ON', 'OFF'],
};

const digitalGroupLabels = [
	{ label: 'Numbers', value: 'numbers' },
	{ label: 'Readouts', value: 'readouts' },
	{ label: 'Marks', value: 'punctuation' },
	{ label: 'Labels', value: 'labels' },
];

const scriptGroupLabels = [
	{ label: 'Sample', value: 'sample' },
	{ label: 'Numbers', value: 'numbers' },
	{ label: 'Punctuation', value: 'punctuation' },
];

const characterNames: Record<string, string> = {
	'&': 'Ampersand',
	'@': 'At sign',
	'#': 'Number sign',
	'%': 'Percent sign',
	'€': 'Euro sign',
	'£': 'Pound sign',
	'¥': 'Yen sign',
	'©': 'Copyright sign',
	'®': 'Registered sign',
	'™': 'Trademark sign',
	fi: 'Fi ligature',
	fl: 'Fl ligature',
	ffi: 'Ffi ligature',
	ffl: 'Ffl ligature',
};

const getCodePoints = (characters: string) =>
	Array.from(characters)
		.map(
			(character) =>
				`U+${(character.codePointAt(0) ?? 0)
					.toString(16)
					.toUpperCase()
					.padStart(4, '0')}`,
		)
		.join(' ');

const getCharacterName = (character: string) =>
	characterNames[character] ??
	(/^\p{M}+$/u.test(character) ? 'Combining mark' : undefined) ??
	(character.length === 1 ? `Character ${character}` : character);

const getDisplayCharacter = (character?: string) =>
	character && /^\p{M}+$/u.test(character) ? `◌${character}` : character;

const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const symbolSeparator = '\u0000';
const getSymbolKey = (name: string, codepoint: number) =>
	`${name}${symbolSeparator}${codepoint}`;
const getSymbolName = (value: string) =>
	value.split(symbolSeparator, 1)[0] ?? value;
const getSymbolCodepoint = (value: string) => {
	const separatorIndex = value.lastIndexOf(symbolSeparator);
	if (separatorIndex === -1) return undefined;
	const codepoint = Number(
		value.slice(separatorIndex + symbolSeparator.length),
	);
	return Number.isInteger(codepoint) ? codepoint : undefined;
};
const formatCodepoint = (codepoint: number) =>
	`U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;

const getScriptGroups = (metadata: GetFontResponse) => {
	const preview = getLanguagePreviewText(
		getPreferredPreviewSubset(metadata),
		metadata.id,
	);
	const unique = Array.from(
		new Set(Array.from(preview).filter((character) => !/\s/u.test(character))),
	);
	const punctuation = unique.filter((character) => /\p{P}/u.test(character));

	return {
		sample: unique,
		numbers: [...'0123456789'],
		punctuation: punctuation.length > 0 ? punctuation : [...'.,;:!?'],
	};
};

export const CharacterExplorer = ({
	metadata,
	staticCSS,
	variableCSS,
	registry,
	languages,
	symbols,
	capabilities,
	capabilitySource,
	registryUnavailable = false,
	capabilitiesUnavailable = false,
	symbolsUnavailable = false,
}: CharacterExplorerProps) => {
	const isIconFamily = isIconFontFamily(metadata, registry);
	const isPunctuationFamily = isPunctuationFontFamily(metadata, registry);
	const isDigitalFamily = isDigitalFontFamily(metadata, registry);
	const symbolCount = symbols?.length ?? 0;
	const hasSymbolCatalog = symbolCount > 0;
	const previewSubset = getPreferredPreviewSubset(metadata);
	const isScriptFamily = !isLatinPreviewSubset(previewSubset);
	const scriptGroups = useMemo(() => getScriptGroups(metadata), [metadata]);
	const registryCharacterCatalog = useMemo(
		() => getRegistryCharacterGroups(capabilities),
		[capabilities],
	);
	const registryCharacterGroups = registryCharacterCatalog?.groups;
	const symbolEntries = useMemo(
		() =>
			symbols?.map((symbol) => getSymbolKey(symbol.name, symbol.codepoint)) ??
			[],
		[symbols],
	);
	const firstSymbolEntryByName = useMemo(() => {
		const entries = new Map<string, string>();
		for (const symbol of symbols ?? []) {
			if (!entries.has(symbol.name)) {
				entries.set(symbol.name, getSymbolKey(symbol.name, symbol.codepoint));
			}
		}
		return entries;
	}, [symbols]);
	const specialistAllGroup = registryCharacterGroups?.all;
	const explorerGroups: Record<string, readonly string[]> = useMemo(
		() =>
			isIconFamily
				? {
						...Object.fromEntries(
							Object.entries(iconGroups).map(([name, entries]) => [
								name,
								entries.flatMap((entry) => {
									const catalogEntry = firstSymbolEntryByName.get(entry);
									return catalogEntry
										? [catalogEntry]
										: hasSymbolCatalog
											? []
											: [entry];
								}),
							]),
						),
						all: symbolEntries,
					}
				: isPunctuationFamily
					? {
							...japanesePunctuationGroups,
							...(specialistAllGroup ? { all: specialistAllGroup } : {}),
						}
					: isDigitalFamily
						? {
								...digitalGroups,
								...(specialistAllGroup ? { all: specialistAllGroup } : {}),
							}
						: (registryCharacterGroups ??
							(isScriptFamily ? scriptGroups : characterGroups)),
		[
			firstSymbolEntryByName,
			hasSymbolCatalog,
			isDigitalFamily,
			isIconFamily,
			isPunctuationFamily,
			isScriptFamily,
			registryCharacterGroups,
			scriptGroups,
			specialistAllGroup,
			symbolEntries,
		],
	);
	const groupLabels = useMemo(() => {
		if (isIconFamily) {
			return iconGroupLabels.filter(
				(item) =>
					(item.value !== 'all' || hasSymbolCatalog) &&
					(explorerGroups[item.value]?.length ?? 0) > 0,
			);
		}
		if (isPunctuationFamily) {
			return specialistAllGroup
				? [...japanesePunctuationLabels, { label: 'All', value: 'all' }]
				: japanesePunctuationLabels;
		}
		if (isDigitalFamily) {
			return specialistAllGroup
				? [...digitalGroupLabels, { label: 'All', value: 'all' }]
				: digitalGroupLabels;
		}
		if (registryCharacterGroups) {
			return registryCharacterGroupLabels.filter(
				(item) => registryCharacterGroups[item.value].length > 0,
			);
		}
		return isScriptFamily ? scriptGroupLabels : characterGroupLabels;
	}, [
		isDigitalFamily,
		isIconFamily,
		isPunctuationFamily,
		isScriptFamily,
		explorerGroups,
		hasSymbolCatalog,
		registryCharacterGroups,
		specialistAllGroup,
	]);
	const [mode, setMode] = useState<ExplorerMode>('browse');
	const [group, setGroup] = useState(groupLabels[0].value);
	const [query, setQuery] = useState('');
	const [selected, setSelected] = useState(
		explorerGroups[groupLabels[0].value]?.[0] ?? '&',
	);
	const [sample, setSample] = useState(
		isIconFamily
			? 'home search favorite menu close'
			: isPunctuationFamily
				? '「ことば」を、心地よく。'
				: isDigitalFamily
					? '12:48:36'
					: isScriptFamily
						? getLanguagePreviewText(previewSubset, metadata.id)
						: 'Woven by time. Made to be read.',
	);
	const characterClipboard = useClipboard({ timeout: 1500 });
	const codeClipboard = useClipboard({ timeout: 1500 });
	const fontFamily = getFontFamilyStack(metadata, Boolean(variableCSS));
	const deferredQuery = useDeferredValue(query);
	const searchableCharacters = useMemo(
		() =>
			explorerGroups.all && explorerGroups.all.length > 0
				? explorerGroups.all
				: Array.from(new Set(Object.values(explorerGroups).flat())),
		[explorerGroups],
	);
	const matchingCharacters = useMemo(() => {
		const normalized = normalizeSearchValue(deferredQuery);
		if (!normalized) return explorerGroups[group] ?? [];

		return searchableCharacters.filter((character) => {
			const displayCharacter = isIconFamily
				? getSymbolName(character)
				: character;
			const name = normalizeSearchValue(getCharacterName(displayCharacter));
			const searchableCharacter = normalizeSearchValue(displayCharacter);
			const codePoint = isIconFamily
				? (getSymbolCodepoint(character)?.toString(16).toLowerCase() ??
					searchableCharacter)
				: getCodePoints(character).toLowerCase();
			return (
				searchableCharacter.includes(normalized) ||
				name.includes(normalized) ||
				codePoint.includes(normalized)
			);
		});
	}, [
		deferredQuery,
		explorerGroups,
		group,
		isIconFamily,
		searchableCharacters,
	]);
	const visibleCharacters = matchingCharacters.slice(0, 120);
	const activeCharacter = visibleCharacters.includes(selected)
		? selected
		: visibleCharacters[0];
	const resultSummary =
		matchingCharacters.length === 0
			? 'No matching characters'
			: `${matchingCharacters.length.toLocaleString('en')} ${matchingCharacters.length === 1 ? 'character' : 'characters'}`;
	const [announcedResultSummary, setAnnouncedResultSummary] =
		useState(resultSummary);
	const activeDisplayCharacter =
		isIconFamily && activeCharacter
			? getSymbolName(activeCharacter)
			: getDisplayCharacter(activeCharacter);
	const activeSymbolCodepoint = getSymbolCodepoint(activeCharacter ?? '');
	const selectedName = isIconFamily
		? activeDisplayCharacter
				?.split('_')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
		: activeCharacter
			? getCharacterName(activeCharacter)
			: '';
	const selectedCodePoint = isIconFamily
		? activeSymbolCodepoint !== undefined
			? `${formatCodepoint(activeSymbolCodepoint)} · Ligature: ${activeDisplayCharacter}`
			: `Ligature: ${activeDisplayCharacter ?? ''}`
		: activeCharacter
			? getCodePoints(activeCharacter)
			: '';
	const specimenStyle = {
		fontFamily,
		fontFeatureSettings: isIconFamily ? '"liga"' : undefined,
		direction: getPreviewDirection(previewSubset),
	};
	const heading = isIconFamily
		? 'Find a symbol.'
		: isPunctuationFamily
			? 'Explore punctuation.'
			: isDigitalFamily
				? 'Build a readout.'
				: isScriptFamily
					? 'Explore the script.'
					: 'Explore glyphs.';
	const description = isIconFamily
		? `Search common ligature names, inspect symbols, and copy what you need from ${metadata.family}.`
		: isPunctuationFamily
			? `Compare punctuation forms and try ${metadata.family} in Japanese context.`
			: isDigitalFamily
				? `Compose numbers, labels, and display patterns with ${metadata.family}.`
				: `Browse a practical character set or inspect your own text in ${metadata.family}.`;
	const searchPlaceholder = isIconFamily
		? 'Search home, arrow, or settings'
		: isDigitalFamily
			? 'Search 8, colon, or U+003A'
			: isScriptFamily
				? 'Search a character or code point'
				: 'Search A, ampersand, or U+0026';
	const familyLanguages =
		languages?.filter((language) =>
			registry?.languages.includes(language.id),
		) ?? [];
	const primaryLanguage = familyLanguages.find(
		(language) => language.id === registry?.primaryLanguage,
	);
	const coverageTitle = isIconFamily
		? 'Ligature-based interface symbols'
		: isPunctuationFamily
			? 'Japanese punctuation and spacing'
			: isDigitalFamily
				? 'Segment display characters'
				: registry
					? capabilities
						? `${capabilities.codepointCount.toLocaleString('en')} mapped characters`
						: `${registry.languages.length.toLocaleString('en')} registry languages`
					: `${metadata.subsets.length} downloadable subsets`;
	const coverageDescription = isIconFamily
		? 'Type or copy a symbol name such as home or arrow_forward.'
		: isPunctuationFamily
			? 'Designed to adjust punctuation width when paired with Japanese body fonts.'
			: isDigitalFamily
				? 'Optimized for numbers, time, temperature, and compact status labels.'
				: primaryLanguage
					? `${primaryLanguage.preferredName ?? primaryLanguage.name} is the primary language.`
					: registry?.primaryScript
						? `${registry.primaryScript} is the primary script.`
						: registryUnavailable
							? 'Registry language details are temporarily unavailable.'
							: 'Registry language metadata is not available for this family yet.';
	const checkerLabel = isIconFamily
		? 'Preview symbol names'
		: isPunctuationFamily
			? 'Try punctuation in context'
			: isDigitalFamily
				? 'Try a readout'
				: 'Inspect your own text';
	const sampleNotice = isIconFamily
		? hasSymbolCatalog
			? `${symbolCount.toLocaleString('en')} named symbols are verified from the registry catalog. Up to 120 matches are shown at once.`
			: symbolsUnavailable
				? 'The complete registry symbol catalog is temporarily unavailable, so only a curated set is shown.'
				: 'This family does not publish a named symbol catalog.'
		: capabilities
			? `Exact coverage for ${capabilitySource?.filename ?? 'the representative source'}: ${capabilities.codepointCount.toLocaleString('en')} mapped characters and ${capabilities.glyphCount.toLocaleString('en')} glyphs.${registryCharacterCatalog?.truncated ? ' Browse shows a bounded sample; Inspect my text still checks the complete cmap.' : ''}`
			: capabilitiesUnavailable
				? 'Exact source coverage is temporarily unavailable, so a practical sample is shown.'
				: 'This family does not publish source capability data.';
	const unmappedCharacters = useMemo(
		() => findUnmappedCharacters(sample, capabilities),
		[sample, capabilities],
	);
	const unknownSymbols = useMemo(() => {
		if (!isIconFamily || !hasSymbolCatalog || !symbols) return [];
		const knownNames = new Set(symbols.map((symbol) => symbol.name));
		return Array.from(
			new Set(
				sample
					.trim()
					.split(/\s+/)
					.filter((name) => name && !knownNames.has(name)),
			),
		);
	}, [hasSymbolCatalog, isIconFamily, sample, symbols]);
	const coverageCheckMessage = isIconFamily
		? hasSymbolCatalog
			? unknownSymbols.length === 0
				? 'Every entered symbol name is in the registry catalog.'
				: `${unknownSymbols.length.toLocaleString('en')} ${unknownSymbols.length === 1 ? 'name is' : 'names are'} not in the registry catalog: ${unknownSymbols.slice(0, 6).join(', ')}${unknownSymbols.length > 6 ? '…' : ''}`
			: 'Symbol catalog verification is unavailable.'
		: capabilities
			? unmappedCharacters.length === 0
				? `Every visible character is mapped by ${capabilitySource?.filename ?? 'the representative source'}.`
				: `${unmappedCharacters.length.toLocaleString('en')} ${unmappedCharacters.length === 1 ? 'character is' : 'characters are'} not mapped directly: ${unmappedCharacters
						.slice(0, 12)
						.map((character) => getDisplayCharacter(character))
						.join(' ')}${unmappedCharacters.length > 12 ? ' …' : ''}`
			: 'Exact source coverage verification is unavailable.';

	useEffect(() => {
		const timeout = window.setTimeout(
			() => setAnnouncedResultSummary(resultSummary),
			250,
		);
		return () => window.clearTimeout(timeout);
	}, [resultSummary]);

	const moveGlyphFocus = (
		event: KeyboardEvent<HTMLButtonElement>,
		index: number,
	) => {
		const grid = event.currentTarget.parentElement;
		const columnCount = grid
			? Math.max(
					1,
					window
						.getComputedStyle(grid)
						.gridTemplateColumns.split(' ')
						.filter(Boolean).length,
				)
			: 1;
		let nextIndex = index;

		switch (event.key) {
			case 'ArrowLeft':
				nextIndex = index - 1;
				break;
			case 'ArrowRight':
				nextIndex = index + 1;
				break;
			case 'ArrowUp':
				nextIndex = index - columnCount;
				break;
			case 'ArrowDown':
				nextIndex = index + columnCount;
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = visibleCharacters.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		nextIndex = Math.min(visibleCharacters.length - 1, Math.max(0, nextIndex));
		const nextCharacter = visibleCharacters[nextIndex];
		if (!nextCharacter) return;

		setSelected(nextCharacter);
		window.requestAnimationFrame(() => {
			document.getElementById(`glyph-${metadata.id}-${nextIndex}`)?.focus();
		});
	};

	const renderInspector = (variantClass: string) =>
		activeCharacter ? (
			<aside
				className={`${classes.inspector} ${variantClass}`}
				aria-live="polite"
			>
				<div className={classes.largeCharacter} style={specimenStyle}>
					{activeDisplayCharacter}
				</div>
				<strong>{selectedName}</strong>
				<code>{selectedCodePoint}</code>
				<button
					type="button"
					className={classes.primaryCopy}
					onClick={() =>
						characterClipboard.copy(
							isIconFamily
								? (activeDisplayCharacter ?? '')
								: (activeCharacter ?? ''),
						)
					}
				>
					<IconCopy aria-hidden stroke="currentColor" />
					{characterClipboard.copied
						? 'Copied'
						: characterClipboard.error
							? 'Copy failed'
							: isIconFamily
								? 'Copy ligature'
								: 'Copy character'}
				</button>
				{!isIconFamily && (
					<button
						type="button"
						className={classes.secondaryCopy}
						onClick={() => codeClipboard.copy(selectedCodePoint)}
					>
						<IconCopy aria-hidden />
						{codeClipboard.copied
							? 'Copied'
							: codeClipboard.error
								? 'Copy failed'
								: `Copy ${selectedCodePoint}`}
					</button>
				)}
				{(characterClipboard.error || codeClipboard.error) && (
					<p className={classes.copyError} role="status">
						Clipboard access was blocked. Select the character or code shown
						above and copy it manually.
					</p>
				)}
			</aside>
		) : null;

	return (
		<section className={classes.page} aria-labelledby="characters-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: variableCSS ?? staticCSS }}
			/>

			<div className={classes.headingRow}>
				<div>
					<h2 id="characters-heading">{heading}</h2>
					<p>{description}</p>
				</div>
				<fieldset className={classes.modeSwitch} aria-label="Character tools">
					<button
						type="button"
						data-active={mode === 'browse' || undefined}
						aria-pressed={mode === 'browse'}
						onClick={() => setMode('browse')}
					>
						Browse glyphs
					</button>
					<button
						type="button"
						data-active={mode === 'check' || undefined}
						aria-pressed={mode === 'check'}
						onClick={() => setMode('check')}
					>
						Inspect my text
					</button>
				</fieldset>
			</div>

			{mode === 'browse' ? (
				<>
					<div className={classes.filters}>
						<label className={classes.search}>
							<IconSearch aria-hidden height={18} />
							<span className={classes.visuallyHidden}>Search characters</span>
							<input
								type="search"
								placeholder={searchPlaceholder}
								value={query}
								onChange={(event) => setQuery(event.currentTarget.value)}
							/>
						</label>
						<fieldset
							className={classes.groupSwitch}
							aria-label="Character group"
						>
							{groupLabels.map((item) => (
								<button
									key={item.value}
									type="button"
									data-active={group === item.value || undefined}
									aria-pressed={group === item.value}
									onClick={() => {
										setGroup(item.value);
										setSelected(explorerGroups[item.value]?.[0] ?? '&');
										setQuery('');
									}}
								>
									{item.label}
								</button>
							))}
						</fieldset>
					</div>
					<p
						className={classes.resultSummary}
						aria-live="polite"
						aria-atomic="true"
					>
						{announcedResultSummary}
					</p>

					{renderInspector(classes.mobileInspector)}

					<div className={classes.explorer}>
						<div className={classes.catalog}>
							<fieldset
								className={classes.grid}
								style={specimenStyle}
								data-glyph-grid
							>
								<legend className={classes.visuallyHidden}>
									{metadata.family} character results
								</legend>
								{visibleCharacters.map((character, index) => {
									const displayCharacter = isIconFamily
										? getSymbolName(character)
										: (getDisplayCharacter(character) ?? character);
									const symbolCodepoint = getSymbolCodepoint(character);
									const symbolLabel =
										symbolCodepoint === undefined
											? ''
											: `, ${formatCodepoint(symbolCodepoint)}`;

									return (
										<button
											key={`${group}-${character}`}
											id={`glyph-${metadata.id}-${index}`}
											type="button"
											aria-label={
												isIconFamily
													? `${getCharacterName(displayCharacter)}, ligature ${displayCharacter}${symbolLabel}`
													: `${getCharacterName(character)}, ${getCodePoints(character)}`
											}
											aria-pressed={activeCharacter === character}
											data-active={activeCharacter === character || undefined}
											tabIndex={activeCharacter === character ? 0 : -1}
											onClick={() => setSelected(character)}
											onFocus={() => setSelected(character)}
											onKeyDown={(event) => moveGlyphFocus(event, index)}
										>
											{displayCharacter}
										</button>
									);
								})}
								{visibleCharacters.length === 0 && (
									<div className={classes.empty}>
										<p>No characters match “{query}”.</p>
										{query && (
											<button type="button" onClick={() => setQuery('')}>
												Clear search
											</button>
										)}
									</div>
								)}
							</fieldset>
							{matchingCharacters.length > visibleCharacters.length && (
								<p className={classes.resultLimit}>
									Showing the first{' '}
									{visibleCharacters.length.toLocaleString('en')} of{' '}
									{matchingCharacters.length.toLocaleString('en')} matches.
									Refine your search to narrow the catalog.
								</p>
							)}
						</div>

						{renderInspector(classes.desktopInspector)}
					</div>
				</>
			) : (
				<div className={classes.checker}>
					<label htmlFor="character-checker">{checkerLabel}</label>
					<p>Paste the words, names, numbers, or symbols you plan to use.</p>
					<textarea
						id="character-checker"
						rows={5}
						value={sample}
						onChange={(event) => setSample(event.currentTarget.value)}
						style={specimenStyle}
					/>
					<p className={classes.checkHint}>
						This previews shaping and spacing. {coverageCheckMessage}
					</p>
				</div>
			)}

			<details className={classes.coverage}>
				<summary>
					<span>Coverage</span>
					<strong>{coverageTitle}</strong>
					<span className={classes.disclosureIcon} aria-hidden="true" />
				</summary>
				<div className={classes.coverageDetails}>
					<p>{coverageDescription}</p>
					<p className={classes.sampleNotice}>{sampleNotice}</p>
					{familyLanguages.length > 0 ? (
						<>
							<strong>
								{(
									registry?.languages.length ?? familyLanguages.length
								).toLocaleString('en')}{' '}
								supported languages
							</strong>
							<ul className={classes.coverageLanguages}>
								{familyLanguages.map((language) => (
									<li key={language.id}>
										<strong>{language.preferredName ?? language.name}</strong>
										<span>
											{language.autonym ?? language.name} · {language.script}
										</span>
									</li>
								))}
							</ul>
							{(registry?.languages.length ?? 0) > familyLanguages.length && (
								<p className={classes.sampleNotice}>
									Showing {familyLanguages.length.toLocaleString('en')} entries,
									with the primary language first.
								</p>
							)}
						</>
					) : !isIconFamily && !isPunctuationFamily && !isDigitalFamily ? (
						<ul className={classes.subsets} aria-label="Downloadable subsets">
							{metadata.subsets.slice(0, 6).map((subset) => (
								<li key={subset}>{subset.replaceAll('-', ' ')}</li>
							))}
						</ul>
					) : null}
				</div>
			</details>
		</section>
	);
};
