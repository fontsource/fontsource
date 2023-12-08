import { useSelector } from '@legendapp/state/react';
import { Center, Group, SegmentedControl, Text, Tooltip } from '@mantine/core';
import { useSortBy } from 'react-instantsearch';

import { DropdownSimple } from '@/components/Dropdown';
import { IconGrid, IconList } from '@/components/icons';

import { display } from './observables';
import classes from './Sort.module.css';

interface SortProps {
	count: number;
}

const indexMap: Record<string, string> = {
	prod_POPULAR: 'Most Popular',
	prod_NEWEST: 'Last Updated',
	prod_NAME: 'Name',
	prod_RANDOM: 'Random',
};

const Sort = ({ count }: SortProps) => {
	const displaySelect = useSelector(display);

	const sortItems = Object.entries(indexMap).map(([key, label]) => ({
		label,
		value: key,
	}));

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
						label={indexMap[currentRefinement]}
						items={sortMenuItems}
						refine={refine}
						w={140}
					/>
					<Text span ml="xs" mr={-8} fz={14}>
						Display
					</Text>
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
											<IconGrid
												height={20}
												data-active={displaySelect === 'grid'}
											/>
										</Center>
									),
									value: 'grid',
								},
								{
									label: (
										<Center>
											<IconList
												height={20}
												data-active={displaySelect === 'list'}
											/>
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
