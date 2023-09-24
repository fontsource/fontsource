import { useSelector } from '@legendapp/state/react';
import {
	Center,
	Group,
	Menu,
	SegmentedControl,
	Text,
	Tooltip,
} from '@mantine/core';
import { useSortBy } from 'react-instantsearch-hooks-web';

import { Dropdown, IconGrid, IconList } from '@/components';

import { display, sort } from './observables';
import classes from './Sort.module.css';

interface SortItemProps {
	value: string;
	setState: (value: any) => void;
}

const SortItem = ({ value, setState }: SortItemProps) => {
	return (
		<Menu.Item
			style={{ width: '100%' }}
			onClick={() => {
				setState(value);
			}}
		>
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
				<Group className={classes['display=group']}>
					<Text fz={15}>Display</Text>
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
