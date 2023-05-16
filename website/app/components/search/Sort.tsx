import { useSelector } from '@legendapp/state/react';
import {
	Center,
	createStyles,
	Group,
	Menu,
	rem,
	SegmentedControl,
	Text,
	Tooltip,
} from '@mantine/core';
import { useSortBy } from 'react-instantsearch-hooks-web';

import { Dropdown, IconGrid, IconList } from '@/components';

import { display, sort } from './observables';

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		height: rem(64),
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: rem(10),
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		'&:focus-within': {
			borderBottomColor: theme.colors.purple[0],
		},
	},

	displayGroup: {
		display: 'flex',

		[`@media (max-width: ${theme.breakpoints.sm})`]: {
			display: 'none',
		},
	},

	control: {
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.button[1]
				: theme.colors.button[0],
		borderRadius: '6px',

		label: {
			padding: rem(5),
		},
	},
}));

interface SortItemProps {
	value: string;
	setState: (value: any) => void;
}

const SortItem = ({ value, setState }: SortItemProps) => {
	return (
		<Menu.Item style={{ width: '100%' }} onClick={() => setState(value)}>
			{value}
		</Menu.Item>
	);
};

interface SortProps {
	count: number;
}

const indexMap = {
	'Most Popular': 'prod_POPULAR',
	'Last Updated': 'prod_NEWEST',
	Name: 'prod_NAME',
	Random: 'prod_RANDOM',
};

const Sort = ({ count }: SortProps) => {
	const { classes } = useStyles();
	const sortSelect = useSelector(sort);
	const displaySelect = useSelector(display);

	const { refine } = useSortBy({
		items: [
			{ value: 'prod_POPULAR', label: 'Most Popular' },
			{ value: 'prod_NEWEST', label: 'Last Updated' },
			{ value: 'prod_NAME', label: 'Name' },
			{ value: 'prod_RANDOM', label: 'Random' },
		],
	});

	const updateOrder = (value: keyof typeof indexMap) => {
		refine(indexMap[value]);
		sort.set(value);
	};

	return (
		<div className={classes.wrapper}>
			<Text>{count} families loaded</Text>
			<Group>
				<Dropdown label={sortSelect} width={150}>
					<SortItem value="Most Popular" setState={updateOrder} />
					<SortItem value="Last Updated" setState={updateOrder} />
					<SortItem value="Name" setState={updateOrder} />
					<SortItem value="Random" setState={updateOrder} />
				</Dropdown>
				<Group className={classes.displayGroup}>
					<Text size={15}>Display</Text>
					<Tooltip
						label={displaySelect === 'grid' ? 'Grid' : 'List'}
						openDelay={600}
						closeDelay={100}
					>
						<SegmentedControl
							className={classes.control}
							value={displaySelect}
							onChange={display.set as (value: string) => void}
							data={[
								{
									label: (
										<Center>
											<IconGrid height={20} active={displaySelect === 'grid'} />
										</Center>
									),
									value: 'grid',
								},
								{
									label: (
										<Center>
											<IconList height={20} active={displaySelect === 'list'} />
										</Center>
									),
									value: 'list',
								},
							]}
						/>
					</Tooltip>
				</Group>
			</Group>
		</div>
	);
};

export { Sort };
