import {
	Box,
	Button,
	Checkbox,
	Group,
	SimpleGrid,
	UnstyledButton,
} from '@mantine/core';
import { useClearRefinements, useToggleRefinement } from 'react-instantsearch';

import { IconTrash } from '@/components/icons';

import { CategoriesDropdown, LanguagesDropdown } from './Dropdowns';
import classes from './Filters.module.css';
import { PreviewSelector } from './PreviewTextInput';
import { SearchBar } from './SearchTextInput';
import { SizeSlider } from './SizeSlider';

const Filters = () => {
	const {
		value: variableValue,
		refine: variableRefine,
		canRefine,
	} = useToggleRefinement({
		attribute: 'variable',
	});
	const { refine: clearRefinements } = useClearRefinements();

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
								display: 'flex',
							}}
						/>
					</UnstyledButton>
					<Button
						leftSection={<IconTrash />}
						variant="subtle"
						className={classes.button}
						onClick={() => {
							clearRefinements();
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
