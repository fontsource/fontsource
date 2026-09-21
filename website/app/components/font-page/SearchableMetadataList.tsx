import { VisuallyHidden } from '@mantine/core';
import { type Key, type ReactNode, useMemo, useState } from 'react';

import { IconSearch } from '@/components/icons';
import { normalizeSearchValue } from '@/utils/search';

import classes from './SearchableMetadataList.module.css';

interface SearchableMetadataListProps<T> {
	emptyLabel: string;
	getKey: (item: T) => Key;
	getSearchText: (item: T) => string;
	itemName: { singular: string; plural: string };
	items: readonly T[];
	listClassName: string;
	listId: string;
	renderItem: (item: T) => ReactNode;
	searchLabel: string;
	searchId: string;
	searchThreshold: number;
}

const SearchableMetadataList = <T,>({
	emptyLabel,
	getKey,
	getSearchText,
	itemName,
	items,
	listClassName,
	listId,
	renderItem,
	searchLabel,
	searchId,
	searchThreshold,
}: SearchableMetadataListProps<T>) => {
	const [query, setQuery] = useState('');
	const normalizedQuery = normalizeSearchValue(query);
	const filteredItems = useMemo(
		() =>
			normalizedQuery
				? items.filter((item) =>
						normalizeSearchValue(getSearchText(item)).includes(normalizedQuery),
					)
				: items,
		[getSearchText, items, normalizedQuery],
	);
	return (
		<div className={classes.root}>
			{items.length > searchThreshold && (
				<label htmlFor={searchId} className={classes.search}>
					<IconSearch aria-hidden height={16} />
					<VisuallyHidden>{searchLabel}</VisuallyHidden>
					<input
						id={searchId}
						type="search"
						autoComplete="off"
						placeholder={`Search ${items.length.toLocaleString('en')} ${itemName.plural}`}
						value={query}
						aria-controls={listId}
						onChange={(event) => setQuery(event.currentTarget.value)}
					/>
				</label>
			)}

			{query && filteredItems.length > 0 && (
				<p className={classes.status} role="status">
					{filteredItems.length.toLocaleString('en')} matching{' '}
					{filteredItems.length === 1 ? itemName.singular : itemName.plural}
				</p>
			)}

			{filteredItems.length > 0 ? (
				<ul id={listId} className={`${classes.list} ${listClassName}`}>
					{filteredItems.map((item) => (
						<li key={getKey(item)}>{renderItem(item)}</li>
					))}
				</ul>
			) : (
				<p id={listId} className={classes.empty} role="status">
					{emptyLabel} “{query}”.
				</p>
			)}
		</div>
	);
};

export { SearchableMetadataList };
