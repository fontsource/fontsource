import { VisuallyHidden } from '@mantine/core';
import { useClipboard, useDebouncedValue } from '@mantine/hooks';
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
	getPreferredPreviewSubset,
	getPreviewDirection,
	isLatinPreviewSubset,
} from '@/utils/font-preview';
import { getPreviewText as getLanguagePreviewText } from '@/utils/language/language';
import {
	findUnmappedCharacters,
	getRegistryCharacterGroups,
	getRegistryFamilyKind,
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

interface CharacterExplorerProps {
	metadata: GetFontResponse;
	staticCSS: string;
	variableCSS?: string;
	registry?: RegistryFamily;
	languages?: ListRegistryLanguagesResponse;
	symbols?: GetRegistryFamilySymbolsResponse;
	capabilities?: GetRegistrySourceCapabilitiesResponse;
	capabilitySource?: RegistrySource;
	languageMetadataState: RegistryDataState;
	capabilitiesState: RegistryDataState;
	symbolsState: RegistryDataState;
}

type ExplorerMode = 'browse' | 'check';

const glyphBatchSize = 240;
const maxSearchLength = 256;
const maxDisplayedUnknownNameLength = 48;

const registryCharacterGroupLabels = [
	{ label: 'All', value: 'all' },
	{ label: 'Letters', value: 'letters' },
	{ label: 'Marks', value: 'marks' },
	{ label: 'Numbers', value: 'numbers' },
	{ label: 'Punctuation', value: 'punctuation' },
	{ label: 'Symbols', value: 'symbols' },
	{ label: 'Private use', value: 'privateUse' },
] as const;

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

const truncateDisplayValue = (
	value: string,
	maxLength = maxDisplayedUnknownNameLength,
) => {
	const characters = Array.from(value);
	return characters.length > maxLength
		? `${characters.slice(0, maxLength - 1).join('')}…`
		: value;
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
		privateUse: all.filter((character) => /^\p{Co}$/u.test(character)),
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
	languageMetadataState,
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
	const isScriptFamily = !isLatinPreviewSubset(previewSubset);
	const fallbackSample = useMemo(
		() =>
			registry?.sampleText?.long ??
			registry?.sampleText?.short ??
			getLanguagePreviewText(previewSubset),
		[previewSubset, registry?.sampleText],
	);
	const fallbackGroups = useMemo(
		() => ({ all: getSampleCharacters(fallbackSample) }),
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
	const symbolSearch = useMemo(
		() =>
			hasCatalogEntries && symbols ? createSymbolSearch(symbols) : undefined,
		[hasCatalogEntries, symbols],
	);
	const explorerGroups: Record<string, readonly string[]> = useMemo(
		() =>
			hasCatalogEntries
				? { all: symbolEntries }
				: (resolvedCharacterGroups ?? fallbackGroups),
		[fallbackGroups, hasCatalogEntries, resolvedCharacterGroups, symbolEntries],
	);
	const groupLabels = registryCharacterGroupLabels.filter(
		(item) => (explorerGroups[item.value]?.length ?? 0) > 0,
	);
	const defaultGroup = groupLabels[0]?.value ?? 'all';
	const [mode, setMode] = useState<ExplorerMode>('browse');
	const [group, setGroup] = useState(defaultGroup);
	const activeGroup = groupLabels.some((item) => item.value === group)
		? group
		: defaultGroup;
	const [query, setQuery] = useState('');
	const [languageQuery, setLanguageQuery] = useState('');
	const [visibleCharacterCount, setVisibleCharacterCount] =
		useState(glyphBatchSize);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [selected, setSelected] = useState(
		explorerGroups[defaultGroup]?.[0] ?? '&',
	);
	const catalogSample = symbols
		?.slice(0, 5)
		.map((symbol) =>
			hasNamedLigatures
				? symbol.name
				: (getUnicodeCharacter(symbol.codepoint) ?? symbol.name),
		)
		.join(' ');
	const registrySample = registry?.sampleText?.short.trim();
	const [sample, setSample] = useState(
		registrySample ||
			catalogSample ||
			(isScriptFamily
				? getLanguagePreviewText(previewSubset)
				: metadata.family),
	);
	const characterClipboard = useClipboard({ timeout: 1500 });
	const codeClipboard = useClipboard({ timeout: 1500 });
	const fontFamily = getFontFamilyStack(
		metadata,
		Boolean(variableCSS),
		registry,
	);
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
		if (symbolSearch) return searchSymbolCatalog(symbolSearch, deferredQuery);

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
	const visibleCharacters = matchingCharacters.slice(0, visibleCharacterCount);
	const remainingCharacterCount = Math.max(
		0,
		matchingCharacters.length - visibleCharacters.length,
	);
	const hasMoreCharacters = remainingCharacterCount > 0;
	const nextBatchSize = Math.min(glyphBatchSize, remainingCharacterCount);
	useEffect(() => {
		const loadMore = loadMoreRef.current;
		if (
			!loadMore ||
			!hasMoreCharacters ||
			typeof IntersectionObserver === 'undefined'
		) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (
					!entry?.isIntersecting ||
					loadMore.contains(document.activeElement)
				) {
					return;
				}
				setVisibleCharacterCount((count) =>
					Math.min(count + glyphBatchSize, matchingCharacters.length),
				);
			},
			{ rootMargin: '240px 0px' },
		);
		observer.observe(loadMore);
		return () => observer.disconnect();
	}, [hasMoreCharacters, matchingCharacters.length]);
	const activeCharacter = visibleCharacters.includes(selected)
		? selected
		: visibleCharacters[0];
	const showingSampleCharacters =
		!hasCatalogEntries && (!capabilities || !resolvedCharacterGroups);
	const canRetryExplorer =
		capabilitiesState === 'unavailable' ||
		(catalogExpected && symbolsState === 'unavailable');
	const resultSummary =
		matchingCharacters.length === 0
			? `No matching ${hasCatalogEntries ? 'symbols' : 'characters'}`
			: `${matchingCharacters.length.toLocaleString('en')} ${showingSampleCharacters ? 'sample ' : ''}${hasCatalogEntries ? (matchingCharacters.length === 1 ? 'symbol' : 'symbols') : matchingCharacters.length === 1 ? 'character' : 'characters'}${
					showingSampleCharacters
						? capabilities
							? ' · loading exact source coverage'
							: capabilitiesState === 'unavailable'
								? ' · exact coverage temporarily unavailable'
								: ' · exact coverage is not published'
						: ''
				}${hasMoreCharacters ? ` · showing ${visibleCharacters.length.toLocaleString('en')}` : ''}`;
	const [announcedResultSummary] = useDebouncedValue(resultSummary, 250);
	const activeIsCatalogEntry = activeCharacter
		? isSymbolKey(activeCharacter)
		: false;
	const activeDisplayCharacter = activeCharacter
		? getSymbolDisplayValue(activeCharacter, hasNamedLigatures)
		: undefined;
	const activeSymbolCodepoint = getSymbolCodepoint(activeCharacter ?? '');
	const activeSymbolName = activeIsCatalogEntry
		? getSymbolName(activeCharacter ?? '')
		: undefined;
	const selectedName = activeSymbolName
		? formatFontLabel(activeSymbolName)
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
	const specimenStyle: CSSProperties = {
		fontFamily,
		fontFeatureSettings: hasNamedLigatures ? '"liga"' : undefined,
		direction: getPreviewDirection(previewSubset),
		...getRegistrySourcePreviewStyle(capabilitySource),
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
				: `Browse a practical character set or inspect your own text in ${metadata.family}.`;
	const searchPlaceholder = catalogExpected
		? hasNamedLigatures
			? 'Search home, arrow, or settings'
			: 'Search a symbol name or code point'
		: isDigitalFamily
			? 'Search 8, colon, or U+003A'
			: isScriptFamily
				? 'Search a character or code point'
				: 'Search A, ampersand, or U+0026';
	const familyLanguages = languages ?? [];
	const normalizedLanguageQuery = normalizeSearchValue(languageQuery);
	const filteredFamilyLanguages = useMemo(
		() =>
			normalizedLanguageQuery
				? familyLanguages.filter((language) =>
						[
							language.id,
							language.name,
							language.preferredName,
							language.autonym,
							language.script,
						]
							.filter(Boolean)
							.some((value) =>
								normalizeSearchValue(String(value)).includes(
									normalizedLanguageQuery,
								),
							),
					)
				: familyLanguages,
		[familyLanguages, normalizedLanguageQuery],
	);
	const primaryLanguage = familyLanguages.find(
		(language) => language.id === registry?.primaryLanguage,
	);
	const coverageTitle = catalogExpected
		? hasNamedLigatures
			? 'Named interface symbols'
			: 'Catalogued symbols'
		: isPunctuationFamily
			? 'Japanese punctuation and spacing'
			: isDigitalFamily
				? 'Segment display characters'
				: registry
					? capabilities
						? `${capabilities.codepointCount.toLocaleString('en')} mapped code points`
						: `${registry.languages.length.toLocaleString('en')} supported languages`
					: `${metadata.subsets.length} downloadable subsets`;
	const coverageDescription = catalogExpected
		? hasNamedLigatures
			? 'Type or copy a symbol name such as home or arrow_forward.'
			: 'Copy symbols directly from their Unicode mappings.'
		: isPunctuationFamily
			? 'Designed to adjust punctuation width when paired with Japanese body fonts.'
			: isDigitalFamily
				? 'Optimized for numbers, time, temperature, and compact status labels.'
				: isSymbolFamily
					? 'Designed for mapped symbols rather than running language text.'
					: capabilities && registry?.languages.length
						? 'Source character coverage and family language support are shown separately.'
						: primaryLanguage
							? `${primaryLanguage.preferredName ?? primaryLanguage.name} is listed as the primary language.`
							: registry?.primaryScript
								? `${registry.primaryScript} is listed as the primary script.`
								: languageMetadataState === 'unavailable'
									? 'Language details are temporarily unavailable.'
									: 'Language details are not available for this family.';
	const checkerLabel = catalogExpected
		? hasNamedLigatures
			? 'Preview symbol names'
			: 'Preview symbols'
		: isPunctuationFamily
			? 'Try punctuation in context'
			: isDigitalFamily
				? 'Try a readout'
				: 'Inspect your own text';
	const sampleNotice = catalogExpected
		? hasCatalogEntries
			? `${symbolCount.toLocaleString('en')} symbols are available in the Registry catalog.`
			: symbolsState === 'unavailable'
				? 'The symbol catalog is temporarily unavailable. You can still browse mapped characters when source coverage is available.'
				: 'A named symbol catalog is not available for this family.'
		: capabilities
			? `Exact coverage for ${capabilitySource?.filename ?? 'the selected source'}: ${capabilities.codepointCount.toLocaleString('en')} mapped characters and ${capabilities.glyphCount.toLocaleString('en')} glyphs.`
			: capabilitiesState === 'unavailable'
				? 'Exact source coverage is temporarily unavailable, so a practical sample is shown.'
				: 'Exact source coverage is not published, so a practical sample is shown.';
	const unmappedCharacters = useMemo(
		() => findUnmappedCharacters(sample, capabilities),
		[sample, capabilities],
	);
	const unknownSymbols = useMemo(() => {
		if (!hasNamedLigatures || !hasCatalogEntries || !symbols) return [];
		const knownNames = new Set(symbols.map((symbol) => symbol.name));
		return Array.from(
			new Set(
				sample
					.trim()
					.split(/\s+/)
					.filter((name) => name && !knownNames.has(name)),
			),
		);
	}, [hasCatalogEntries, hasNamedLigatures, sample, symbols]);
	const coverageCheckMessage = hasNamedLigatures
		? hasCatalogEntries
			? unknownSymbols.length === 0
				? 'Every entered symbol name is in the Registry catalog.'
				: `${unknownSymbols.length.toLocaleString('en')} ${unknownSymbols.length === 1 ? 'name is' : 'names are'} not in the Registry catalog: ${unknownSymbols
						.slice(0, 6)
						.map((name) => truncateDisplayValue(name))
						.join(', ')}${unknownSymbols.length > 6 ? '…' : ''}`
			: 'Symbol catalog details are unavailable.'
		: capabilities
			? unmappedCharacters.length === 0
				? `Every visible character is mapped by ${capabilitySource?.filename ?? 'the selected source'}.`
				: `${unmappedCharacters.length.toLocaleString('en')} ${unmappedCharacters.length === 1 ? 'character is' : 'characters are'} not mapped directly: ${unmappedCharacters
						.slice(0, 12)
						.map((character) => getDisplayCharacter(character))
						.join(' ')}${unmappedCharacters.length > 12 ? ' …' : ''}`
			: capabilitiesState === 'unavailable'
				? 'Exact source coverage is temporarily unavailable.'
				: 'Exact source coverage is not published for this family.';

	const moveGlyphFocus = (
		event: KeyboardEvent<HTMLButtonElement>,
		index: number,
	) => {
		const grid = event.currentTarget.closest('[data-glyph-grid]');
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
	const updateQuery = (value: string) => {
		setQuery(value);
		setVisibleCharacterCount(glyphBatchSize);
		setSelected(value ? '' : (explorerGroups[activeGroup]?.[0] ?? '&'));
	};
	const primaryCopyValue =
		hasNamedLigatures && activeSymbolName
			? activeSymbolName
			: (activeDisplayCharacter ?? '');

	const renderInspector = (variantClass: string) =>
		activeCharacter ? (
			<aside
				className={`${classes.inspector} ${variantClass}`}
				aria-label={
					activeIsCatalogEntry ? 'Selected symbol' : 'Selected character'
				}
			>
				<div className={classes.largeCharacter} style={specimenStyle}>
					{activeDisplayCharacter}
				</div>
				<strong>{selectedName}</strong>
				<code>{selectedCodePoint}</code>
				<button
					type="button"
					className={classes.primaryCopy}
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
						{showingSampleCharacters ? 'Browse sample' : 'Browse glyphs'}
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
									onClick={() => {
										setGroup(item.value);
										setSelected(explorerGroups[item.value]?.[0] ?? '&');
										setQuery('');
										setVisibleCharacterCount(glyphBatchSize);
									}}
								>
									{item.label}
								</button>
							))}
						</fieldset>
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
								{revalidator.state === 'idle'
									? 'Try again'
									: 'Checking Registry…'}
							</button>
						)}
					</div>

					{renderInspector(classes.mobileInspector)}

					<div className={classes.explorer}>
						<div className={classes.catalog}>
							<fieldset
								className={classes.grid}
								style={specimenStyle}
								data-glyph-grid
							>
								<VisuallyHidden component="legend">
									{metadata.family} character results
								</VisuallyHidden>
								{visibleCharacters.map((character, index) => {
									const catalogEntry = isSymbolKey(character);
									const displayCharacter = getSymbolDisplayValue(
										character,
										hasNamedLigatures,
									);
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
							{hasMoreCharacters && (
								<div className={classes.loadMore} ref={loadMoreRef}>
									<button
										type="button"
										onClick={() =>
											setVisibleCharacterCount((count) =>
												Math.min(
													count + glyphBatchSize,
													matchingCharacters.length,
												),
											)
										}
									>
										Show {nextBatchSize.toLocaleString('en')} more
									</button>
								</div>
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
					{registry &&
					!isSymbolFamily &&
					!isPunctuationFamily &&
					!isDigitalFamily ? (
						<>
							<strong>
								{registry.languages.length.toLocaleString('en')} supported
								languages
							</strong>
							{familyLanguages.length > 0 ? (
								<>
									{familyLanguages.length > 12 && (
										<label
											className={`${classes.search} ${classes.coverageSearch}`}
											htmlFor={`language-search-${metadata.id}`}
										>
											<IconSearch aria-hidden height={16} />
											<VisuallyHidden>
												Search supported languages
											</VisuallyHidden>
											<input
												id={`language-search-${metadata.id}`}
												type="search"
												autoComplete="off"
												placeholder={`Search ${familyLanguages.length.toLocaleString('en')} languages`}
												value={languageQuery}
												onChange={(event) =>
													setLanguageQuery(event.currentTarget.value)
												}
											/>
										</label>
									)}
									{filteredFamilyLanguages.length > 0 ? (
										<ul className={classes.coverageLanguages}>
											{filteredFamilyLanguages.map((language) => (
												<li key={language.id}>
													<strong>
														{language.preferredName ?? language.name}
													</strong>
													<span>
														{language.autonym ?? language.name} ·{' '}
														{language.script}
													</span>
												</li>
											))}
										</ul>
									) : (
										<p className={classes.sampleNotice} role="status">
											No supported languages match “{languageQuery}”.
										</p>
									)}
								</>
							) : registry.languages.length > 0 ? (
								<p className={classes.sampleNotice}>
									Language names are temporarily unavailable. The Registry still
									reports the exact family coverage count.
								</p>
							) : null}
						</>
					) : !registry &&
						!isSymbolFamily &&
						!isPunctuationFamily &&
						!isDigitalFamily ? (
						<ul className={classes.subsets} aria-label="Downloadable subsets">
							{metadata.subsets.slice(0, 6).map((subset) => (
								<li key={subset}>{formatFontLabel(subset)}</li>
							))}
						</ul>
					) : null}
				</div>
			</details>
		</section>
	);
};
