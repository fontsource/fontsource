import {
	ActionIcon,
	Combobox,
	Loader,
	TextInput,
	useVirtualizedCombobox,
	VisuallyHidden,
} from '@mantine/core';
import { useEffect, useId, useState } from 'react';
import { Form, Link, useNavigate } from 'react-router';

import { IconSearch } from '@/components/icons';
import { DEFAULT_SEARCH_INDEX, searchClient } from '@/utils/algolia-client';

import classes from './HeaderSearch.module.css';

interface FontMatch {
	objectID: string;
	family: string;
	category: string;
}

export const HeaderSearch = () => {
	const [query, setQuery] = useState('');
	const [matches, setMatches] = useState<FontMatch[]>([]);
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('ready');
	const navigate = useNavigate();
	const id = useId();
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const openFont = (fontId: string) => {
		combobox.closeDropdown();
		setQuery('');
		setMatches([]);
		void navigate(`/fonts/${encodeURIComponent(fontId)}`);
	};
	const combobox = useVirtualizedCombobox({
		totalOptionsCount: matches.length,
		selectedOptionIndex: selectedIndex,
		setSelectedOptionIndex: setSelectedIndex,
		getOptionId: (index) => `${id}-${index}`,
		onSelectedOptionSubmit: (index) => openFont(matches[index].objectID),
		onDropdownClose: () => setSelectedIndex(-1),
	});
	const searchQuery = query.trim();
	const resultsUrl = `/?${new URLSearchParams({ query: searchQuery })}`;

	useEffect(() => {
		if (!searchQuery) return;
		let active = true;
		const timeout = window.setTimeout(async () => {
			try {
				const { results } = await searchClient.searchForHits<FontMatch>({
					requests: [
						{
							indexName: DEFAULT_SEARCH_INDEX,
							query: searchQuery,
							hitsPerPage: 5,
							attributesToRetrieve: ['family', 'category'],
							attributesToHighlight: [],
						},
					],
				});
				if (active) {
					setMatches(results[0].hits);
					setStatus('ready');
				}
			} catch {
				if (active) setStatus('error');
			}
		}, 300);
		return () => {
			active = false;
			window.clearTimeout(timeout);
		};
	}, [searchQuery]);

	return (
		<search
			className={classes.search}
			aria-label="Quick font search"
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget))
					combobox.closeDropdown();
			}}
		>
			<Form action="/" onSubmit={() => combobox.closeDropdown()}>
				<Combobox
					store={combobox}
					position="bottom-start"
					withinPortal={false}
					classNames={{ dropdown: classes.dropdown, option: classes.option }}
					readOnly={!searchQuery}
					onOptionSubmit={openFont}
				>
					<Combobox.Target
						withExpandedAttribute
						// Mantine drops undefined overrides; an empty value clears its cached option.
						aria-activedescendant={
							combobox.dropdownOpened && selectedIndex >= 0
								? `${id}-${selectedIndex}`
								: ''
						}
					>
						<TextInput
							type="search"
							aria-autocomplete="list"
							name="query"
							aria-label="Search fonts"
							placeholder="Search fonts"
							autoComplete="off"
							autoCorrect="off"
							spellCheck={false}
							maxLength={512}
							value={query}
							onChange={(event) => {
								const value = event.currentTarget.value;
								setQuery(value);
								if (value.trim() !== searchQuery) {
									setMatches([]);
									setStatus(value.trim() ? 'loading' : 'ready');
								}
								combobox.resetSelectedOption();
								if (value.trim()) combobox.openDropdown();
								else combobox.closeDropdown();
							}}
							onFocus={() => {
								if (searchQuery) combobox.openDropdown();
							}}
							onClick={() => {
								if (searchQuery) combobox.openDropdown();
							}}
							classNames={{ input: classes.input }}
							rightSectionWidth={38}
							rightSectionPointerEvents="all"
							rightSection={
								<ActionIcon
									type="submit"
									variant="transparent"
									color="gray"
									size={30}
									radius={3}
									aria-label="Search fonts"
								>
									<IconSearch aria-hidden height={17} />
								</ActionIcon>
							}
						/>
					</Combobox.Target>
					<Combobox.Dropdown hidden={!searchQuery}>
						<Combobox.Options aria-label="Matching fonts">
							{status === 'ready' &&
								matches.map((font, index) => (
									<Combobox.Option
										value={font.objectID}
										key={font.objectID}
										id={`${id}-${index}`}
										selected={selectedIndex === index}
										aria-selected={selectedIndex === index}
									>
										<bdi className={classes.family}>{font.family}</bdi>
										<span className={classes.category}>
											{font.category.replaceAll('-', ' ')}
										</span>
									</Combobox.Option>
								))}
						</Combobox.Options>
						<div role="status">
							{status === 'loading' && (
								<div className={classes.message}>
									<Loader size={14} />
									Searching fonts…
								</div>
							)}
							{status === 'error' && (
								<div className={classes.message}>
									Suggestions unavailable. Try the full search.
								</div>
							)}
							{status === 'ready' && matches.length === 0 && (
								<div className={classes.message}>No matching fonts.</div>
							)}
							{status === 'ready' && matches.length > 0 && (
								<VisuallyHidden>
									{matches.length} suggestions available.
								</VisuallyHidden>
							)}
						</div>
						<Link
							to={resultsUrl}
							className={classes.allResults}
							onClick={() => combobox.closeDropdown()}
						>
							View all results for “<bdi>{searchQuery}</bdi>”
						</Link>
					</Combobox.Dropdown>
				</Combobox>
			</Form>
		</search>
	);
};
