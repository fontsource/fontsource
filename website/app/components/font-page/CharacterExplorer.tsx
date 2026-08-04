import { VisuallyHidden } from '@mantine/core';
import {
	useClipboard,
	useDebouncedValue,
	useElementSize,
	useMergedRef,
} from '@mantine/hooks';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
	type CSSProperties,
	type KeyboardEvent,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useRevalidator } from 'react-router';
import { DropdownSimple } from '@/components/Dropdown';
import { IconCopy, IconSearch } from '@/components/icons';
import type {
	GetFontResponse,
	GetRegistryFamilySymbolsResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { formatFontLabel } from '@/utils/font-labels';
import {
	getFontFamilyStack,
	getFontPreviewFamily,
	getPreferredPreviewSubset,
	getPreviewDirection,
	getRegistrySourcePreviewCSS,
	isLatinPreviewSubset,
	registrySourcePreviewFamily,
} from '@/utils/font-preview';
import { getPreviewText as getLanguagePreviewText } from '@/utils/language/language';
import {
	getRegistryCharacterGroups,
	getRegistryFamilyKind,
	getRegistryPreviewText,
	getRegistrySourcePreviewStyle,
	getUnicodeCharacter,
	type RegistryDataState,
	type RegistryFamily,
	type RegistrySource,
	usesNameLigatures,
} from '@/utils/registry';
import {
	createSymbolSearch,
	getSymbolSearchKey,
	searchSymbolCatalog,
	symbolSearchSeparator,
} from '@/utils/symbol-search';

import classes from './CharacterExplorer.module.css';
import { FontSkeleton } from './FontSkeleton';
import { GlyphSpecimen } from './GlyphSpecimen';

interface CharacterExplorerProps {
	metadata: GetFontResponse;
	staticCSS: string;
	variableCSS?: string;
	registry?: RegistryFamily;
	languages?: ListRegistryLanguagesResponse;
	symbols?: GetRegistryFamilySymbolsResponse;
	capabilities?: GetRegistrySourceCapabilitiesResponse;
	capabilitySource?: RegistrySource;
	capabilitiesState: RegistryDataState;
	symbolsState: RegistryDataState;
}

const glyphCellSize = 58;
const glyphGridPadding = 36;
const initialGlyphRowCount = 8;
const maxSearchLength = 256;

const registryCharacterGroupLabels = [
	{ label: 'Sample', value: 'sample' },
	{ label: 'All', value: 'all' },
	{ label: 'Letters', value: 'letters' },
	{ label: 'Marks', value: 'marks' },
	{ label: 'Numbers', value: 'numbers' },
	{ label: 'Punctuation', value: 'punctuation' },
	{ label: 'Symbols', value: 'symbols' },
] as const;

const symbolCategoryLabels: Record<string, string> = {
	action: 'Actions',
	alert: 'Alerts',
	av: 'Audio & video',
	communication: 'Communication',
	content: 'Content',
	device: 'Devices',
	editor: 'Editing',
	file: 'Files',
	hardware: 'Hardware',
	home: 'Home',
	image: 'Images',
	maps: 'Maps',
	navigation: 'Navigation',
	notification: 'Notifications',
	places: 'Places',
	search: 'Search',
	social: 'Social',
	symbols: 'Symbols',
	toggle: 'Toggles',
};

type CatalogSymbol = GetRegistryFamilySymbolsResponse[number] & {
	categories?: string[];
};

const getSymbolCategoryValue = (category: string) => `category:${category}`;
const getSymbolCategoryLabel = (category: string) =>
	symbolCategoryLabels[category] ?? formatFontLabel(category);

const characterGroupNouns: Record<string, [singular: string, plural: string]> =
	{
		all: ['character', 'characters'],
		letters: ['letter', 'letters'],
		marks: ['mark', 'marks'],
		numbers: ['number', 'numbers'],
		punctuation: ['punctuation mark', 'punctuation marks'],
		sample: ['sample character', 'sample characters'],
		symbols: ['symbol', 'symbols'],
	};

const getResultNoun = (
	group: string,
	count: number,
	isSymbolCatalog: boolean,
	isSearching: boolean,
) => {
	if (isSearching) {
		const noun = isSymbolCatalog ? 'symbol' : 'character';
		return `matching ${count === 1 ? noun : `${noun}s`}`;
	}

	const nouns = isSymbolCatalog
		? (['symbol', 'symbols'] as const)
		: (characterGroupNouns[group] ?? characterGroupNouns.all);
	const noun = nouns?.[count === 1 ? 0 : 1] ?? 'characters';
	return noun;
};

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

const isCombiningMark = (character: string) => /^\p{M}+$/u.test(character);

const getCharacterName = (character: string) =>
	characterNames[character] ??
	(isCombiningMark(character) ? 'Combining mark' : undefined) ??
	(character.length === 1 ? `Character ${character}` : character);

const getDisplayCharacter = (character?: string) =>
	character && isCombiningMark(character) ? `◌${character}` : character;

const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const getSymbolName = (value: string) =>
	value.split(symbolSearchSeparator, 1)[0] ?? value;
const getSymbolCodepoint = (value: string) => {
	const separatorIndex = value.lastIndexOf(symbolSearchSeparator);
	if (separatorIndex === -1) return undefined;
	const codepoint = Number(
		value.slice(separatorIndex + symbolSearchSeparator.length),
	);
	return getUnicodeCharacter(codepoint) ? codepoint : undefined;
};
const isSymbolKey = (value: string) => value.includes(symbolSearchSeparator);
const formatCodepoint = (codepoint: number) =>
	`U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
const getSymbolDisplayValue = (value: string, useNameLigature: boolean) => {
	if (!isSymbolKey(value)) return getDisplayCharacter(value) ?? value;
	if (useNameLigature) return getSymbolName(value);
	const codepoint = getSymbolCodepoint(value);
	return codepoint === undefined
		? getSymbolName(value)
		: (getUnicodeCharacter(codepoint) ?? getSymbolName(value));
};

const getSampleCharacters = (value: string) =>
	Array.from(
		new Set(Array.from(value).filter((character) => !/\s/u.test(character))),
	);

const getSampleCharacterGroups = (value: string) => {
	const all = getSampleCharacters(value);
	return {
		all,
		letters: all.filter((character) => /^\p{L}$/u.test(character)),
		marks: all.filter((character) => /^\p{M}$/u.test(character)),
		numbers: all.filter((character) => /^\p{N}$/u.test(character)),
		punctuation: all.filter((character) => /^\p{P}$/u.test(character)),
		symbols: all.filter((character) => /^\p{S}$/u.test(character)),
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
	capabilitiesState,
	symbolsState,
}: CharacterExplorerProps) => {
	const revalidator = useRevalidator();
	const catalogExpected = Boolean(registry?.symbols);
	const hasNamedLigatures = usesNameLigatures(registry);
	const familyKind = getRegistryFamilyKind(registry);
	const isSymbolFamily = familyKind === 'symbols';
	const isPunctuationFamily = familyKind === 'punctuation';
	const isDigitalFamily = familyKind === 'digital';
	const symbolCount = symbols?.length ?? 0;
	const hasCatalogEntries = symbolCount > 0;
	const previewSubset = getPreferredPreviewSubset(metadata, registry);
	const isScriptFamily = registry?.primaryScript
		? registry.primaryScript !== 'Latn'
		: !isLatinPreviewSubset(previewSubset);
	const registryPreviewText =
		registry?.sampleText || isScriptFamily
			? getRegistryPreviewText(registry, languages, 'long')
			: undefined;
	const fallbackSample = useMemo(
		() => registryPreviewText ?? getLanguagePreviewText(previewSubset),
		[previewSubset, registryPreviewText],
	);
	const fallbackGroups = useMemo(
		() => getSampleCharacterGroups(fallbackSample),
		[fallbackSample],
	);
	const representativeCharacters = useMemo(
		() => getSampleCharacters(fallbackSample),
		[fallbackSample],
	);
	const [resolvedCharacterGroups, setResolvedCharacterGroups] =
		useState<ReturnType<typeof getRegistryCharacterGroups>>();
	useEffect(() => {
		// Unicode category data is runtime-owned. Resolve after hydration so Node
		// and browsers with different Unicode versions cannot disagree during SSR.
		setResolvedCharacterGroups(
			getRegistryCharacterGroups(capabilities) ??
				getSampleCharacterGroups(fallbackSample),
		);
	}, [capabilities, fallbackSample]);
	const symbolEntries = useMemo(
		() => symbols?.map(getSymbolSearchKey) ?? [],
		[symbols],
	);
	const symbolCategories = useMemo(() => {
		const entries = symbols as CatalogSymbol[] | undefined;
		return Array.from(
			new Set(entries?.flatMap((symbol) => symbol.categories ?? []) ?? []),
		).sort((left, right) =>
			getSymbolCategoryLabel(left).localeCompare(getSymbolCategoryLabel(right)),
		);
	}, [symbols]);
	const symbolCategoriesByKey = useMemo(() => {
		const entries = symbols as CatalogSymbol[] | undefined;
		return new Map(
			entries?.map((symbol) => [
				getSymbolSearchKey(symbol),
				symbol.categories ?? [],
			]) ?? [],
		);
	}, [symbols]);
	const symbolSearch = useMemo(
		() =>
			hasCatalogEntries && symbols ? createSymbolSearch(symbols) : undefined,
		[hasCatalogEntries, symbols],
	);
	const explorerGroups: Record<string, readonly string[]> = useMemo(() => {
		if (hasCatalogEntries) {
			return Object.fromEntries([
				['all', symbolEntries],
				...symbolCategories.map((category) => [
					getSymbolCategoryValue(category),
					symbolEntries.filter((entry) =>
						symbolCategoriesByKey.get(entry)?.includes(category),
					),
				]),
			]);
		}
		const characterGroups = resolvedCharacterGroups ?? fallbackGroups;
		return isScriptFamily
			? { sample: representativeCharacters, ...characterGroups }
			: characterGroups;
	}, [
		fallbackGroups,
		hasCatalogEntries,
		isScriptFamily,
		representativeCharacters,
		resolvedCharacterGroups,
		symbolCategories,
		symbolCategoriesByKey,
		symbolEntries,
	]);
	const groupLabels = hasCatalogEntries
		? [
				{ label: 'All categories', value: 'all' },
				...symbolCategories.map((category) => ({
					label: getSymbolCategoryLabel(category),
					value: getSymbolCategoryValue(category),
				})),
			]
		: registryCharacterGroupLabels.filter(
				(item) => (explorerGroups[item.value]?.length ?? 0) > 0,
			);
	const defaultGroup = groupLabels[0]?.value ?? 'all';
	const [group, setGroup] = useState(defaultGroup);
	const activeGroup = groupLabels.some((item) => item.value === group)
		? group
		: defaultGroup;
	const [query, setQuery] = useState('');
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const catalogRef = useRef<HTMLDivElement>(null);
	const { ref: catalogSizeRef, width: catalogWidth } =
		useElementSize<HTMLDivElement>();
	const mergedCatalogRef = useMergedRef(catalogRef, catalogSizeRef);
	const [selected, setSelected] = useState('');
	const characterClipboard = useClipboard({ timeout: 1500 });
	const codeClipboard = useClipboard({ timeout: 1500 });
	const sourceCSS = capabilitySource
		? getRegistrySourcePreviewCSS(capabilitySource)
		: undefined;
	const previewFamily = sourceCSS
		? registrySourcePreviewFamily
		: getFontPreviewFamily(metadata, Boolean(variableCSS));
	const fontFamily = sourceCSS
		? `"${previewFamily}", "Fallback Outline"`
		: getFontFamilyStack(metadata, Boolean(variableCSS), registry);
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
		if (!normalized) return explorerGroups[activeGroup] ?? [];
		if (symbolSearch) {
			const activeCharacters = new Set(explorerGroups[activeGroup] ?? []);
			return searchSymbolCatalog(symbolSearch, deferredQuery).filter((entry) =>
				activeCharacters.has(entry),
			);
		}

		return searchableCharacters.filter((character) => {
			const catalogEntry = isSymbolKey(character);
			const displayCharacter = getSymbolDisplayValue(
				character,
				hasNamedLigatures,
			);
			const catalogName = catalogEntry ? getSymbolName(character) : undefined;
			const name = normalizeSearchValue(
				catalogName ?? getCharacterName(displayCharacter),
			);
			const searchableCharacter = normalizeSearchValue(displayCharacter);
			const codePoint = catalogEntry
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
		activeGroup,
		hasNamedLigatures,
		searchableCharacters,
		symbolSearch,
	]);
	const columnCount = Math.max(
		1,
		Math.floor(
			Math.max(catalogWidth - glyphGridPadding, glyphCellSize) / glyphCellSize,
		),
	);
	const characterRows = useMemo(
		() =>
			Array.from(
				{ length: Math.ceil(matchingCharacters.length / columnCount) },
				(_, index) =>
					matchingCharacters.slice(
						index * columnCount,
						(index + 1) * columnCount,
					),
			),
		[matchingCharacters, columnCount],
	);
	const rowVirtualizer = useVirtualizer({
		count: mounted ? characterRows.length : 0,
		getScrollElement: () => catalogRef.current,
		estimateSize: () => glyphCellSize,
		getItemKey: (index) => characterRows[index]?.[0] ?? index,
		overscan: 5,
	});
	const virtualRows = rowVirtualizer.getVirtualItems();
	const renderedRows = mounted
		? virtualRows
		: characterRows.slice(0, initialGlyphRowCount).map((_, index) => ({
				index,
				key: index,
				start: index * glyphCellSize,
				size: glyphCellSize,
			}));
	const virtualGridHeight = mounted
		? rowVirtualizer.getTotalSize()
		: renderedRows.length * glyphCellSize;
	const activeCharacter = matchingCharacters.includes(selected)
		? selected
		: undefined;
	const focusableCharacter = activeCharacter ?? matchingCharacters[0];
	const showingSampleCharacters =
		!hasCatalogEntries && (!capabilities || !resolvedCharacterGroups);
	const canRetryExplorer =
		capabilitiesState === 'unavailable' ||
		(catalogExpected && symbolsState === 'unavailable');
	const resultNoun = getResultNoun(
		activeGroup,
		matchingCharacters.length,
		hasCatalogEntries,
		Boolean(deferredQuery),
	);
	const resultSummary =
		matchingCharacters.length === 0
			? `No matching ${hasCatalogEntries ? 'symbols' : 'characters'}`
			: `${matchingCharacters.length.toLocaleString('en')} ${resultNoun}${
					showingSampleCharacters
						? capabilities
							? ' · loading exact source coverage'
							: capabilitiesState === 'unavailable'
								? ' · exact coverage temporarily unavailable'
								: ' · exact coverage is not published'
						: ''
				}`;
	const [announcedResultSummary] = useDebouncedValue(resultSummary, 250);
	const activeIsCatalogEntry = activeCharacter
		? isSymbolKey(activeCharacter)
		: false;
	const activeSymbolCodepoint = getSymbolCodepoint(activeCharacter ?? '');
	const activeSymbolName = activeIsCatalogEntry
		? getSymbolName(activeCharacter ?? '')
		: undefined;
	const markPreviewBase = explorerGroups.letters?.[0] ?? '\u00a0';
	const activeIsCombiningMark = activeCharacter
		? isCombiningMark(activeCharacter)
		: false;
	const getPreviewCharacter = (character: string) =>
		isCombiningMark(character)
			? `${markPreviewBase}${character}`
			: getSymbolDisplayValue(character, hasNamedLigatures);
	const selectedName = activeSymbolName
		? formatFontLabel(activeSymbolName)
		: activeIsCombiningMark
			? `Combining mark on ${markPreviewBase.trim() || 'a spacing guide'}`
			: activeCharacter
				? getCharacterName(activeCharacter)
				: '';
	const selectedUnicode = activeIsCatalogEntry
		? activeSymbolCodepoint === undefined
			? ''
			: formatCodepoint(activeSymbolCodepoint)
		: activeCharacter
			? getCodePoints(activeCharacter)
			: '';
	const selectedCodePoint =
		hasNamedLigatures && activeSymbolName
			? `${selectedUnicode} · Name ligature: ${activeSymbolName}`
			: selectedUnicode;
	const sourcePreviewStyle = getRegistrySourcePreviewStyle(capabilitySource);
	const specimenStyle: CSSProperties = {
		fontFamily,
		fontFeatureSettings: hasNamedLigatures ? '"liga"' : undefined,
		direction: getPreviewDirection(previewSubset),
		...sourcePreviewStyle,
	};
	const heading = catalogExpected
		? 'Find a symbol.'
		: isPunctuationFamily
			? 'Explore punctuation.'
			: isDigitalFamily
				? 'Build a readout.'
				: isSymbolFamily
					? 'Explore mapped symbols.'
					: isScriptFamily
						? 'Explore the script.'
						: 'Explore glyphs.';
	const description = catalogExpected
		? hasNamedLigatures
			? `Search symbol names, inspect their mappings, and copy what you need from ${metadata.family}.`
			: `Search the symbol catalog and copy mapped characters from ${metadata.family}.`
		: isPunctuationFamily
			? `Compare punctuation forms and try ${metadata.family} in Japanese context.`
			: isDigitalFamily
				? `Compose numbers, labels, and display patterns with ${metadata.family}.`
				: `Browse characters, inspect their Unicode values, and copy what you need from ${metadata.family}.`;
	const searchPlaceholder = catalogExpected
		? hasNamedLigatures
			? 'Search home, arrow, or settings'
			: 'Search a symbol name or code point'
		: isDigitalFamily
			? 'Search 8, colon, or U+003A'
			: isScriptFamily
				? 'Search a character or code point'
				: 'Search A, ampersand, or U+0026';
	const moveGlyphFocus = (
		event: KeyboardEvent<HTMLButtonElement>,
		index: number,
	) => {
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
				nextIndex = matchingCharacters.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		nextIndex = Math.min(matchingCharacters.length - 1, Math.max(0, nextIndex));
		const nextCharacter = matchingCharacters[nextIndex];
		if (!nextCharacter) return;

		setSelected(nextCharacter);
		rowVirtualizer.scrollToIndex(Math.floor(nextIndex / columnCount), {
			align: 'auto',
		});
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				document.getElementById(`glyph-${metadata.id}-${nextIndex}`)?.focus();
			});
		});
	};
	const updateQuery = (value: string) => {
		setQuery(value);
		setSelected('');
		catalogRef.current?.scrollTo({ top: 0 });
	};
	const updateGroup = (value: string) => {
		setGroup(value);
		setSelected('');
		setQuery('');
		catalogRef.current?.scrollTo({ top: 0 });
	};
	const primaryCopyValue =
		hasNamedLigatures && activeSymbolName
			? activeSymbolName
			: (activeCharacter ?? '');
	const renderInspector = (variantClass: string) => (
		<aside
			className={`${classes.inspector} ${variantClass}`}
			aria-label={
				activeCharacter
					? activeIsCatalogEntry
						? 'Selected symbol'
						: 'Selected character'
					: catalogExpected || isSymbolFamily
						? 'Symbol details'
						: 'Character details'
			}
		>
			{activeCharacter ? (
				<>
					<GlyphSpecimen
						canInspectMetrics={
							!activeIsCatalogEntry &&
							!activeIsCombiningMark &&
							Array.from(getPreviewCharacter(activeCharacter)).length === 1
						}
						character={getPreviewCharacter(activeCharacter)}
						copied={characterClipboard.copied}
						showLatinGuides={
							/^\p{Script=Latin}$/u.test(activeCharacter) &&
							searchableCharacters.includes('H') &&
							searchableCharacters.includes('x')
						}
						style={specimenStyle}
					/>
					<strong>{selectedName}</strong>
					<code>{selectedCodePoint}</code>
					<button
						type="button"
						className={classes.primaryCopy}
						data-copied={characterClipboard.copied || undefined}
						onClick={() => characterClipboard.copy(primaryCopyValue)}
					>
						<IconCopy aria-hidden stroke="currentColor" />
						{characterClipboard.copied
							? 'Copied'
							: characterClipboard.error
								? 'Copy failed'
								: hasNamedLigatures && activeSymbolName
									? 'Copy ligature'
									: activeIsCatalogEntry
										? 'Copy symbol'
										: activeIsCombiningMark
											? 'Copy mark'
											: 'Copy character'}
					</button>
					{selectedUnicode && (
						<button
							type="button"
							className={classes.secondaryCopy}
							onClick={() => codeClipboard.copy(selectedUnicode)}
						>
							<IconCopy aria-hidden />
							{codeClipboard.copied
								? 'Copied'
								: codeClipboard.error
									? 'Copy failed'
									: `Copy ${selectedUnicode}`}
						</button>
					)}
					{(characterClipboard.error || codeClipboard.error) && (
						<p className={classes.copyError} role="status">
							Clipboard access was blocked. Select the character or code shown
							above and copy it manually.
						</p>
					)}
				</>
			) : (
				<div className={classes.inspectorEmpty}>
					<h3>
						{catalogExpected || isSymbolFamily
							? 'Select a symbol'
							: 'Select a character'}
					</h3>
					<p>
						{catalogExpected || isSymbolFamily
							? 'Choose any symbol to inspect its mapping and copy it.'
							: 'Choose any glyph to inspect its Unicode value and copy it.'}
					</p>
				</div>
			)}
		</aside>
	);

	return (
		<section className={classes.page} aria-labelledby="characters-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{
					__html: sourceCSS ?? variableCSS ?? staticCSS,
				}}
			/>

			<div className={classes.headingRow}>
				<div>
					<h2 id="characters-heading">{heading}</h2>
					<p>{description}</p>
				</div>
			</div>

			<div className={classes.filters}>
				<label
					className={classes.search}
					htmlFor={`character-search-${metadata.id}`}
				>
					<IconSearch aria-hidden height={18} />
					<VisuallyHidden>
						{catalogExpected ? 'Search symbols' : 'Search characters'}
					</VisuallyHidden>
					<input
						id={`character-search-${metadata.id}`}
						type="search"
						autoCapitalize="none"
						autoComplete="off"
						autoCorrect="off"
						maxLength={maxSearchLength}
						placeholder={searchPlaceholder}
						spellCheck={false}
						value={query}
						onChange={(event) => updateQuery(event.currentTarget.value)}
					/>
				</label>
				{hasCatalogEntries && groupLabels.length > 1 ? (
					<DropdownSimple
						label={
							groupLabels.find((item) => item.value === activeGroup)?.label ??
							'All categories'
						}
						ariaLabel="Filter symbols by category"
						items={groupLabels.map((item) => ({
							...item,
							isRefined: item.value === activeGroup,
						}))}
						refine={updateGroup}
						w={180}
						dropdownWidth={220}
					/>
				) : groupLabels.length > 1 ? (
					<fieldset
						className={classes.groupSwitch}
						aria-label="Character group"
					>
						{groupLabels.map((item) => (
							<button
								key={item.value}
								type="button"
								data-active={activeGroup === item.value || undefined}
								aria-pressed={activeGroup === item.value}
								onClick={() => updateGroup(item.value)}
							>
								{item.label}
							</button>
						))}
					</fieldset>
				) : null}
			</div>
			<div className={classes.resultSummary}>
				<span aria-live="polite" aria-atomic="true">
					{announcedResultSummary}
				</span>
				{canRetryExplorer && (
					<button
						type="button"
						disabled={revalidator.state !== 'idle'}
						onClick={() => void revalidator.revalidate()}
					>
						{revalidator.state === 'idle' ? 'Try again' : 'Checking Registry…'}
					</button>
				)}
			</div>

			<FontSkeleton
				name="font-detail-glyph-explorer"
				family={previewFamily}
				weight={
					typeof sourcePreviewStyle.fontWeight === 'number'
						? sourcePreviewStyle.fontWeight
						: 400
				}
				style={sourcePreviewStyle.fontStyle}
			>
				{renderInspector(classes.mobileInspector)}

				<div className={classes.explorer}>
					<div className={classes.catalog} ref={mergedCatalogRef}>
						<fieldset
							className={classes.grid}
							style={specimenStyle}
							data-glyph-grid
						>
							<VisuallyHidden component="legend">
								{metadata.family} character results
							</VisuallyHidden>
							<div
								className={classes.virtualGrid}
								style={{ height: virtualGridHeight }}
							>
								{renderedRows.map((virtualRow) => {
									const row = characterRows[virtualRow.index] ?? [];
									return (
										<div
											key={virtualRow.key}
											className={classes.virtualRow}
											style={{
												gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
												transform: `translateY(${virtualRow.start}px)`,
											}}
										>
											{row.map((character, columnIndex) => {
												const index =
													virtualRow.index * columnCount + columnIndex;
												const catalogEntry = isSymbolKey(character);
												const displayCharacter = getPreviewCharacter(character);
												const symbolCodepoint = getSymbolCodepoint(character);
												const symbolLabel =
													symbolCodepoint === undefined
														? ''
														: `, ${formatCodepoint(symbolCodepoint)}`;

												return (
													<button
														key={`${activeGroup}-${character}`}
														id={`glyph-${metadata.id}-${index}`}
														type="button"
														aria-label={
															catalogEntry
																? `${getCharacterName(getSymbolName(character))}${hasNamedLigatures ? `, name ligature ${getSymbolName(character)}` : ''}${symbolLabel}`
																: `${getCharacterName(character)}, ${getCodePoints(character)}${isCombiningMark(character) ? `, previewed on ${markPreviewBase.trim() || 'a spacing guide'}` : ''}`
														}
														aria-pressed={activeCharacter === character}
														data-active={
															activeCharacter === character || undefined
														}
														tabIndex={focusableCharacter === character ? 0 : -1}
														onClick={() => setSelected(character)}
														onFocus={() => setSelected(character)}
														onKeyDown={(event) => moveGlyphFocus(event, index)}
													>
														{displayCharacter}
													</button>
												);
											})}
										</div>
									);
								})}
							</div>
							{matchingCharacters.length === 0 && (
								<div className={classes.empty}>
									<p>
										{catalogExpected && symbolsState === 'unavailable'
											? 'The symbol catalog is temporarily unavailable.'
											: query
												? `No ${catalogExpected ? 'symbols' : 'characters'} match “${query}”.`
												: 'No mapped characters are available for this source.'}
									</p>
									{query && (
										<button type="button" onClick={() => updateQuery('')}>
											Clear search
										</button>
									)}
								</div>
							)}
						</fieldset>
					</div>

					{renderInspector(classes.desktopInspector)}
				</div>
			</FontSkeleton>
		</section>
	);
};
