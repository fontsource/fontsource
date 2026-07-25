import { observer, useValue } from '@legendapp/state/react';
import {
	Group,
	SegmentedControl,
	Text,
	Tooltip,
	VisuallyHidden,
} from '@mantine/core';
import { useSortBy } from 'react-instantsearch';

import { DropdownSimple } from '@/components/Dropdown';
import { IconGrid, IconList } from '@/components/icons';

import type { SearchState } from './observables';
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

const numberFormatter = new Intl.NumberFormat('en');

const getSortItems = () => {
	return Object.entries(sortMap).map(([key, label]) => ({
		label,
		value: key,
	}));
};

const Sort = observer(({ count, state$ }: SortProps) => {
	const display = useValue(state$.display);
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
		<Group className={classes.wrapper} justify="space-between" wrap="nowrap">
			<Text aria-atomic="true" role="status">
				{numberFormatter.format(count)}{' '}
				{count === 1 ? 'font family' : 'font families'}
			</Text>
			<Group>
				<Group visibleFrom="sm">
					<DropdownSimple
						label={sortMap[currentRefinement]}
						items={sortMenuItems}
						refine={refine}
						w={140}
					/>
					<Text span ml="xs" mr={-8} fz={14}>
						Display
					</Text>
					<Tooltip label="Change view" openDelay={600} closeDelay={100}>
						<SegmentedControl
							aria-label="Display mode"
							className={classes.control}
							value={display}
							onChange={state$.display.set as (value: string) => void}
							data={[
								{
									label: (
										<>
											<IconGrid
												aria-hidden="true"
												height={20}
												data-active={display === 'grid'}
											/>
											<VisuallyHidden>Grid view</VisuallyHidden>
										</>
									),
									value: 'grid',
								},
								{
									label: (
										<>
											<IconList
												aria-hidden="true"
												height={20}
												data-active={display === 'list'}
											/>
											<VisuallyHidden>List view</VisuallyHidden>
										</>
									),
									value: 'list',
								},
							]}
						/>
					</Tooltip>
				</Group>
			</Group>
		</Group>
	);
});

export { getSortItems, Sort };
