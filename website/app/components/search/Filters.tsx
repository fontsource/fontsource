import { useSelector } from '@legendapp/state/react';
import {
	Box,
	Button,
	Checkbox,
	Group,
	SimpleGrid,
	UnstyledButton,
} from '@mantine/core';
import { useConfigure } from 'react-instantsearch';

import { IconTrash } from '@/components/icons';

import { CategoriesDropdown, LanguagesDropdown } from './Dropdowns';
import classes from './Filters.module.css';
import { category, filter, language, variable } from './observables';
import { PreviewSelector } from './PreviewTextInput';
import { SearchBar } from './SearchTextInput';
import { SizeSlider } from './SizeSlider';

const Filters = () => {
	const filterSelect = useSelector(filter);
	const variableSelect = useSelector(variable);
	// 24 is divisible by 2, 3 and 4 for the hits grid
	useConfigure({
		filters: filterSelect,
		attributesToHighlight: [],
		page: 0,
		hitsPerPage: 24,
	});

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
							variable.set(!variable.get());
						}}
					>
						<Checkbox
							color="purple.0"
							label="Show only variable fonts"
							checked={variableSelect}
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
							variable.set(false);
							language.set('');
							category.set('');
							filter.set('');
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
