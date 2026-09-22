import { useValue } from '@legendapp/state/react';
import { Box, Button, Checkbox, Group } from '@mantine/core';
import { useCallback } from 'react';
import {
	Configure,
	useClearRefinements,
	useInstantSearch,
	useRefinementList,
	useSearchBox,
	useSortBy,
	useToggleRefinement,
} from 'react-instantsearch';
import { IconTrash } from '@/components/icons';
import { CollectionFilter } from '@/features/collections/CollectionFilter';
import { useCollectionsStore } from '@/features/collections/CollectionsProvider';
import { DEFAULT_SEARCH_INDEX } from '@/utils/algolia-client';

import {
	CategoriesDropdown,
	LanguagesDropdown,
	type SearchFacets,
} from './Dropdowns';
import classes from './Filters.module.css';
import type { SearchState } from './observables';
import { PreviewSelector } from './PreviewTextInput';
import { SearchBar } from './SearchTextInput';
import { SizeSlider } from './SizeSlider';
import { getSortItems } from './Sort';

interface FilterProps extends SearchFacets {
	state$: SearchState;
}

// Algolia cannot read browser local collections. Convert local membership into
// an object ID filter and use an impossible ID so empty collections show no fonts.
const EMPTY_COLLECTION_FILTER = 'objectID:"__fontsource_empty_collection__"';

const buildCollectionFilter = (fontIds: string[]) =>
	fontIds.length === 0
		? EMPTY_COLLECTION_FILTER
		: fontIds
				.map((fontId) => `objectID:${JSON.stringify(fontId)}`)
				.join(' OR ');

const Filters = ({ state$, languages, taxonomy }: FilterProps) => {
	const collectionsStore = useCollectionsStore();
	const collectionId = useValue(state$.collectionId);
	const collections = useValue(collectionsStore.getCollections);
	const collection = collections.find((item) => item.id === collectionId);
	const collectionFilter = collection
		? buildCollectionFilter(collection.fontIds)
		: '';
	const { setIndexUiState, indexUiState } = useInstantSearch();
	const { refine: refineTag } = useRefinementList({
		attribute: 'tags',
		operator: 'and',
	});
	const selectedTags = indexUiState.refinementList?.tags ?? [];
	const {
		value: variableValue,
		refine: variableRefine,
		canRefine,
	} = useToggleRefinement({
		attribute: 'variable',
	});
	const { refine: clearQueries } = useSearchBox();
	const { refine: clearRefinements } = useClearRefinements();
	const { refine: clearSortBy } = useSortBy({
		items: getSortItems(),
	});

	const handleClearRefinement = () => {
		state$.collectionId.set(null);
		clearQueries('');
		clearRefinements();
		clearSortBy(DEFAULT_SEARCH_INDEX);
	};
	const handleCollectionChange = useCallback(
		(value: string | null) => {
			state$.collectionId.set(value);
			setIndexUiState((currentState) => ({
				...currentState,
				page: 0,
			}));
		},
		[setIndexUiState, state$],
	);

	return (
		<Box className={classes.container}>
			<Configure filters={collectionFilter} />
			<div className={classes.controls}>
				<SearchBar />
				<PreviewSelector state$={state$} />
				<SizeSlider state$={state$} />
			</div>
			<Box className={classes.filters}>
				<div className={classes.dropdowns}>
					<CollectionFilter
						onChange={handleCollectionChange}
						value={collectionId}
					/>
					<CategoriesDropdown taxonomy={taxonomy} />
					<LanguagesDropdown languages={languages} />
				</div>
				{selectedTags.length > 0 && (
					<Group gap="xs" role="group" aria-label="Selected tags">
						{selectedTags.map((tag) => {
							const label = taxonomy.tags[tag]?.label ?? tag;
							const group = taxonomy.tagGroups[tag.split('/')[0]]?.label;
							const title = group ? `${label} (${group})` : label;
							return (
								<Button
									key={tag}
									variant="subtle"
									className={classes.button}
									aria-label={`Remove ${title} tag filter`}
									onClick={() => refineTag(tag)}
								>
									{title} ×
								</Button>
							);
						})}
					</Group>
				)}
				<Group justify="space-between" gap="sm">
					<Checkbox
						checked={variableValue.isRefined}
						color="purple.0"
						disabled={!canRefine}
						label="Variable fonts"
						onChange={() => {
							variableRefine(variableValue);
						}}
					/>
					<Button
						leftSection={<IconTrash aria-hidden="true" />}
						variant="subtle"
						className={classes.button}
						onClick={() => {
							handleClearRefinement();
						}}
					>
						Clear filters
					</Button>
				</Group>
			</Box>
		</Box>
	);
};

export { Filters };
