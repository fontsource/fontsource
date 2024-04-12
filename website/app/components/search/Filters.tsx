import {
	Box,
	Button,
	Checkbox,
	Group,
	SimpleGrid,
	UnstyledButton,
} from '@mantine/core';
import {
	useClearRefinements,
	useSearchBox,
	useSortBy,
	useToggleRefinement,
} from 'react-instantsearch';

import { IconTrash } from '@/components/icons';

import { CategoriesDropdown, LanguagesDropdown } from './Dropdowns';
import classes from './Filters.module.css';
import { PreviewSelector } from './PreviewTextInput';
import { SearchBar } from './SearchTextInput';
import { SizeSlider } from './SizeSlider';
import { getSortItems } from './Sort';

const Filters = () => {
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
		clearQueries('');
		clearRefinements();
		clearSortBy('prod_POPULAR');
	};

	return (
		<Box className={classes.container}>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={0}>
				<SearchBar />
				<PreviewSelector />
				<SizeSlider />
			</SimpleGrid>
			<Box className={classes.filters}>
				<Group justify="center" wrap="nowrap">
					<CategoriesDropdown />
					<LanguagesDropdown />
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
