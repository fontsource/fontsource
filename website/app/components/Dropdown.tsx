import {
	Badge,
	Checkbox,
	Combobox,
	ComboboxPopover,
	Group,
	rem,
	UnstyledButton,
	useVirtualizedCombobox,
} from '@mantine/core';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { memo, useId, useMemo, useRef, useState } from 'react';

import { IconCaret } from '@/components/icons';

import classes from './Dropdown.module.css';

interface DropdownItem {
	label: string;
	value: string;
	isRefined: boolean;
	count?: number;
}

interface DropdownProps {
	label: string;
	ariaLabel?: string;
	items: DropdownItem[];
	refine?: (value: string) => void;
	w?: number | string;
	dropdownWidth?: number | string;
	noBorder?: boolean;
	showCount?: boolean;
	searchable?: boolean;
	search?: (query: string) => void;
}

const DropdownSimple = memo(function DropdownSimple({
	label,
	ariaLabel,
	items,
	w,
	dropdownWidth,
	noBorder,
	searchable = false,
	refine,
}: DropdownProps) {
	const selected = items.find((item) => item.isRefined)?.value ?? null;
	const data = useMemo(
		() =>
			items.map(({ label: itemLabel, value }) => ({
				label: itemLabel,
				value,
			})),
		[items],
	);
	return (
		<ComboboxPopover
			data={data}
			value={selected}
			allowDeselect={false}
			searchable={searchable}
			nothingFoundMessage={searchable ? 'No matches' : undefined}
			maxDropdownHeight={240}
			comboboxProps={{
				position: 'bottom-start',
				shadow: 'xs',
				classNames: { dropdown: classes.dropdown, option: classes.item },
				transitionProps: { duration: 100, transition: 'fade' },
				width: dropdownWidth ?? w ?? rem(250),
			}}
			onChange={(value) => {
				if (value !== null) refine?.(String(value));
			}}
		>
			<ComboboxPopover.Target>
				<UnstyledButton
					type="button"
					aria-label={ariaLabel ?? label}
					className={classes.input}
					w={w ?? rem(250)}
					data-no-border={noBorder}
					disabled={items.length === 0}
				>
					<span className={classes.label}>{label}</span>
					<IconCaret className={classes.caret} aria-hidden="true" />
				</UnstyledButton>
			</ComboboxPopover.Target>
		</ComboboxPopover>
	);
});

const DropdownCheckbox = ({
	label,
	ariaLabel,
	items,
	w,
	dropdownWidth,
	noBorder,
	refine,
	showCount,
	search,
}: DropdownProps) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const viewport = useRef<HTMLDivElement>(null);
	const id = useId();
	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => viewport.current,
		estimateSize: () => 44,
		overscan: 4,
		rangeExtractor: (range) => {
			const indices = defaultRangeExtractor(range);
			if (
				selectedIndex >= 0 &&
				selectedIndex < items.length &&
				!indices.includes(selectedIndex)
			)
				indices.push(selectedIndex);
			return indices.sort((a, b) => a - b);
		},
	});
	const updateSearch = (query: string) => {
		setSearchQuery(query);
		setSelectedIndex(-1);
		virtualizer.scrollToOffset(0);
		search?.(query);
	};
	const combobox = useVirtualizedCombobox({
		totalOptionsCount: items.length,
		selectedOptionIndex: selectedIndex,
		setSelectedOptionIndex: (index) => {
			setSelectedIndex(index);
			if (index >= 0) virtualizer.scrollToIndex(index);
		},
		getOptionId: (index) => `${id}-${index}`,
		onSelectedOptionSubmit: (index) => refine?.(items[index].value),
		onDropdownOpen: () => {
			if (search) combobox.focusSearchInput();
		},
		onDropdownClose: () => updateSearch(''),
	});

	return (
		<Combobox
			store={combobox}
			position="bottom-start"
			shadow="xs"
			transitionProps={{ duration: 100, transition: 'fade' }}
			classNames={{ dropdown: classes.dropdown, option: classes.item }}
			width={dropdownWidth ?? w ?? rem(250)}
			resetSelectionOnOptionHover={false}
			onOptionSubmit={(value) => refine?.(value)}
		>
			<Combobox.Target targetType="button" withAriaAttributes={!search}>
				<UnstyledButton
					type="button"
					aria-label={ariaLabel ?? label}
					aria-expanded={combobox.dropdownOpened}
					className={classes.input}
					w={w ?? rem(250)}
					data-no-border={noBorder}
					disabled={items.length === 0 && !search}
					onClick={() => combobox.toggleDropdown()}
				>
					<span className={classes.label}>{label}</span>
					<IconCaret className={classes.caret} aria-hidden="true" />
				</UnstyledButton>
			</Combobox.Target>
			<Combobox.Dropdown>
				{search && (
					<Combobox.Search
						value={searchQuery}
						onChange={(event) => updateSearch(event.currentTarget.value)}
						placeholder="Search languages…"
						aria-label="Search languages"
					/>
				)}
				<Combobox.Options aria-label={ariaLabel ?? label} aria-multiselectable>
					<div
						ref={viewport}
						style={{
							height: Math.min(items.length * 44, 264),
							overflowY: 'auto',
							overscrollBehavior: 'contain',
						}}
					>
						<div
							style={{
								height: virtualizer.getTotalSize(),
								position: 'relative',
							}}
						>
							{virtualizer.getVirtualItems().map((row) => {
								const item = items[row.index];
								return (
									<Combobox.Option
										key={item.value}
										id={`${id}-${row.index}`}
										value={item.value}
										selected={selectedIndex === row.index}
										aria-selected={item.isRefined}
										aria-posinset={row.index + 1}
										aria-setsize={items.length}
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											width: '100%',
											height: row.size,
											transform: `translateY(${row.start}px)`,
										}}
									>
										<Group gap="sm" wrap="nowrap" h="100%" w="100%">
											<Checkbox.Indicator
												checked={item.isRefined}
												aria-hidden
											/>
											<span className={classes.option}>{item.label}</span>
											{showCount && item.count !== undefined && (
												<Badge
													variant="light"
													color="gray"
													size="sm"
													className={classes.count}
												>
													{item.count}
												</Badge>
											)}
										</Group>
									</Combobox.Option>
								);
							})}
						</div>
					</div>
					{items.length === 0 && (
						<Combobox.Empty>
							{search ? 'No matching languages' : 'No matches'}
						</Combobox.Empty>
					)}
				</Combobox.Options>
			</Combobox.Dropdown>
		</Combobox>
	);
};

export { DropdownCheckbox, DropdownSimple };
