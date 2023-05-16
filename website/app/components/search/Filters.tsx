import { useSelector } from '@legendapp/state/react';
import {
	Box,
	Button,
	Checkbox,
	createStyles,
	Group,
	rem,
	SimpleGrid,
	UnstyledButton,
} from '@mantine/core';
import { useConfigure } from 'react-instantsearch-hooks-web';

import { IconTrash } from '@/components';

import { CategoriesDropdown, LanguagesDropdown } from './Dropdowns';
import { category, filter, language, variable } from './observables';
import { PreviewSelector } from './PreviewTextInput';
import { SearchBar } from './SearchTextInput';
import { SizeSlider } from './SizeSlider';

const useStyles = createStyles((theme) => ({
	container: {
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],
		borderRadius: '4px',
		height: rem(128),
	},

	filters: {
		display: 'flex',
		height: rem(64),
		alignItems: 'center',
		gap: rem(24),
		justifyContent: 'space-between',
		padding: `0 ${rem(24)}`,
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		overflowY: 'hidden',
		overflowX: 'auto',

		'&:focus-within': {
			borderBottomColor: theme.colors.purple[0],
		},
	},

	button: {
		padding: `${rem(2)} ${rem(16)}`,
		height: rem(40),

		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],

		fontWeight: 400,

		'&:hover': {
			backgroundColor: theme.colors.purpleHover[0],
		},
	},
}));

const Filters = () => {
	const { classes } = useStyles();
	const filterSelect = useSelector(filter);
	// 24 is divisible by 2, 3 and 4 for the hits grid
	useConfigure({
		filters: filterSelect,
		attributesToHighlight: [],
		hitsPerPage: 24,
	});

	return (
		<Box className={classes.container}>
			<SimpleGrid
				cols={3}
				spacing={0}
				breakpoints={[
					{ maxWidth: 'md', cols: 2 },
					{ maxWidth: 'sm', cols: 1 },
				]}
			>
				<SearchBar />
				<PreviewSelector />
				<SizeSlider />
			</SimpleGrid>
			<Box className={classes.filters}>
				<Group position="center" noWrap>
					<CategoriesDropdown />
					<LanguagesDropdown />
				</Group>
				<Group position="center" noWrap>
					<UnstyledButton
						w={200}
						onClick={() => {
							variable.set(!variable.get());
						}}
					>
						<Checkbox
							color="purple"
							label="Show only variable fonts"
							checked={variable.get()}
							readOnly
							style={{
								pointerEvents: 'none',
								display: 'flex',
							}}
						/>
					</UnstyledButton>
					<Button
						leftIcon={<IconTrash />}
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
