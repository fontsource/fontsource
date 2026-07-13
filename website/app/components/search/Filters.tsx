import { useValue } from '@legendapp/state/react';
import {
	Box,
	Button,
	Checkbox,
	Group,
	SimpleGrid,
	UnstyledButton,
} from '@mantine/core';
import { useCallback } from 'react';
import {
	Configure,
	useClearRefinements,
	useInstantSearch,
	useSearchBox,
	useSortBy,
	useToggleRefinement,
} from 'react-instantsearch';

import { IconTrash } from '@/components/icons';
import { CollectionFilter } from '@/features/collections/CollectionFilter';
import { useCollectionsStore } from '@/features/collections/CollectionsProvider';

import { CategoriesDropdown, LanguagesDropdown } from './Dropdowns';
import classes from './Filters.module.css';
import type { SearchState } from './observables';
import { PreviewSelector } from './PreviewTextInput';
import { SearchBar } from './SearchTextInput';
import { SizeSlider } from './SizeSlider';
import { getSortItems } from './Sort';

interface FilterProps {
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

const Filters = ({ state$ }: FilterProps) => {
	const collectionsStore = useCollectionsStore();
	const collectionId = useValue(state$.collectionId);
	const collections = useValue(collectionsStore.getCollections);
	const collection = collections.find((item) => item.id === collectionId);
	const collectionFilter = collection
		? buildCollectionFilter(collection.fontIds)
		: '';
	const { setIndexUiState } = useInstantSearch();
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
		clearSortBy('prod_POPULAR');
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
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={0}>
				<SearchBar />
				<PreviewSelector state$={state$} />
				<SizeSlider state$={state$} />
			</SimpleGrid>
			<Box className={classes.filters}>
				<Group justify="center" wrap="nowrap">
					<CollectionFilter
						onChange={handleCollectionChange}
						value={collectionId}
					/>
					<CategoriesDropdown />
					<LanguagesDropdown state$={state$} />
				</Group>
				<Group justify="center" wrap="nowrap">
					<UnstyledButton
						w={200}
						onClick={() => {
							variableRefine(variableValue);
						}}
						disabled={!canRefine}
					>
						<Checkbox
							color="purple.0"
							label="Show only variable fonts"
							checked={variableValue.isRefined}
							disabled={!canRefine}
							readOnly
							style={{
								pointerEvents: 'none',
							}}
						/>
					</UnstyledButton>
					<Button
						leftSection={<IconTrash />}
						variant="subtle"
						className={classes.button}
						onClick={() => {
							handleClearRefinement();
						}}
					>
						Clear all filters
					</Button>
				</Group>
			</Box>
		</Box>
	);
};

export { Filters };
