import { Center, Group, SegmentedControl, Text, Tooltip } from '@mantine/core';
import { useSortBy } from 'react-instantsearch';

import { DropdownSimple } from '@/components/Dropdown';
import { IconGrid, IconList } from '@/components/icons';

import { type SearchState } from './observables';
import classes from './Sort.module.css';

interface SortProps {
	state$: SearchState;
	count: number;
}

const sortMap: Record<string, string> = {
	prod_POPULAR: 'Most Popular',
	prod_NEWEST: 'Last Updated',
	prod_NAME: 'Name',
	prod_RANDOM: 'Random',
};

export const getSortItems = () => {
	return Object.entries(sortMap).map(([key, label]) => ({
		label,
		value: key,
	}));
};

const Sort = ({ count, state$ }: SortProps) => {
	const display = state$.display.get();
	const sortItems = getSortItems();

	const { currentRefinement, refine } = useSortBy({
		items: sortItems,
	});

	const sortMenuItems = sortItems.map((item, index) => {
		return {
			label: item.label,
			value: item.value,
			isRefined: item.value === currentRefinement,
			count: index,
		};
	});

	return (
		<div className={classes.wrapper}>
			<Text>{count} families loaded</Text>
			<Group>
				<Group className={classes['display-group']}>
					<DropdownSimple
						label={sortMap[currentRefinement]}
						items={sortMenuItems}
						refine={refine}
						w={140}
					/>
					<Text span ml="xs" mr={-8} fz={14}>
						Display
					</Text>
					<Tooltip
						label={display === 'grid' ? 'Grid' : 'List'}
						openDelay={600}
						closeDelay={100}
					>
						<SegmentedControl
							className={classes.control}
							value={display}
							onChange={state$.display.set as (value: string) => void}
							data={[
								{
									label: (
										<Center>
											<IconGrid height={20} data-active={display === 'grid'} />
										</Center>
									),
									value: 'grid',
								},
								{
									label: (
										<Center>
											<IconList height={20} data-active={display === 'list'} />
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
