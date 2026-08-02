import { VisuallyHidden } from '@mantine/core';
import { useMemo, useState } from 'react';

import { IconSearch } from '@/components/icons';
import type { ListRegistryLanguagesResponse } from '@/generated/api';

import classes from './SearchableMetadataList.module.css';

interface SearchableLanguageListProps {
	familyId: string;
	languages: ListRegistryLanguagesResponse;
}

const searchThreshold = 12;

const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const SearchableLanguageList = ({
	familyId,
	languages,
}: SearchableLanguageListProps) => {
	const [query, setQuery] = useState('');
	const normalizedQuery = normalizeSearchValue(query);
	const filteredLanguages = useMemo(
		() =>
			normalizedQuery
				? languages.filter((language) =>
						[
							language.id,
							language.name,
							language.preferredName,
							language.autonym,
							language.script,
						]
							.filter(Boolean)
							.some((value) =>
								normalizeSearchValue(String(value)).includes(normalizedQuery),
							),
					)
				: languages,
		[languages, normalizedQuery],
	);
	const listId = `language-list-${familyId}`;

	return (
		<div className={classes.root}>
			{languages.length > searchThreshold && (
				<label
					htmlFor={`language-search-${familyId}`}
					className={classes.search}
				>
					<IconSearch aria-hidden height={16} />
					<VisuallyHidden>Search supported languages</VisuallyHidden>
					<input
						id={`language-search-${familyId}`}
						type="search"
						autoComplete="off"
						placeholder={`Search ${languages.length.toLocaleString('en')} languages`}
						value={query}
						aria-controls={listId}
						onChange={(event) => setQuery(event.currentTarget.value)}
					/>
				</label>
			)}

			{query && filteredLanguages.length > 0 && (
				<p className={classes.status} role="status">
					{filteredLanguages.length.toLocaleString('en')} matching{' '}
					{filteredLanguages.length === 1 ? 'language' : 'languages'}
				</p>
			)}

			{filteredLanguages.length > 0 ? (
				<ul id={listId} className={classes.list}>
					{filteredLanguages.map((language) => {
						const displayName = language.preferredName ?? language.name;
						const autonym =
							language.autonym && language.autonym !== displayName
								? language.autonym
								: undefined;
						return (
							<li key={language.id}>
								<strong>{displayName}</strong>
								<span>
									{autonym ? `${autonym} · ` : ''}
									{language.script}
								</span>
							</li>
						);
					})}
				</ul>
			) : (
				<p id={listId} className={classes.empty} role="status">
					No supported languages match “{query}”.
				</p>
			)}
		</div>
	);
};

export { SearchableLanguageList };
