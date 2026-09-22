import {
	Checkbox,
	Combobox,
	ComboboxPopover,
	Group,
	rem,
	UnstyledButton,
	useVirtualizedCombobox,
} from '@mantine/core';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import {
	type CSSProperties,
	memo,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';

import { IconCaret } from '@/components/icons';

import classes from './Dropdown.module.css';

interface DropdownItem {
	label: string;
	value: string;
	isRefined: boolean;
}

interface DropdownProps {
	label: string;
	ariaLabel?: string;
	items: DropdownItem[];
	refine?: (value: string) => void;
	w?: number | string;
	dropdownWidth?: number | string;
	noBorder?: boolean;
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
	search,
}: DropdownProps) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [activeValue, setActiveValue] = useState<string | null>(null);
	const selectedItems = items.filter((item) => item.isRefined);
	const availableItems = items.filter((item) => !item.isRefined);
	const orderedItems = [...selectedItems, ...availableItems];
	const selectedIndex = orderedItems.findIndex(
		(item) => item.value === activeValue,
	);
	const activeRow = selectedIndex - selectedItems.length;
	const selectedViewport = useRef<HTMLDivElement>(null);
	const viewport = useRef<HTMLDivElement>(null);
	const id = useId();
	const virtualizer = useVirtualizer({
		count: availableItems.length,
		getItemKey: (index) => availableItems[index].value,
		getScrollElement: () => viewport.current,
		estimateSize: () => 44,
		overscan: 4,
		rangeExtractor: (range) => {
			const indices = defaultRangeExtractor(range);
			if (
				activeRow >= 0 &&
				activeRow < availableItems.length &&
				!indices.includes(activeRow)
			)
				indices.push(activeRow);
			return indices.sort((a, b) => a - b);
		},
	});
	const updateSearch = (query: string) => {
		setSearchQuery(query);
		setActiveValue(null);
		virtualizer.scrollToOffset(0);
		search?.(query);
	};
	const submit = (value: string) => {
		setActiveValue(value);
		virtualizer.scrollToOffset(0);
		refine?.(value);
	};
	const combobox = useVirtualizedCombobox({
		totalOptionsCount: items.length,
		selectedOptionIndex: selectedIndex,
		setSelectedOptionIndex: (index) => {
			setActiveValue(orderedItems[index]?.value ?? null);
			if (index < 0) return;
			if (index >= selectedItems.length) {
				virtualizer.scrollToIndex(index - selectedItems.length);
			}
		},
		getOptionId: (index) => `${id}-${orderedItems[index].value}`,
		onSelectedOptionSubmit: (index) => submit(orderedItems[index].value),
		onDropdownOpen: () => {
			if (search) combobox.focusSearchInput();
		},
		onDropdownClose: () => updateSearch(''),
	});

	useEffect(() => {
		if (selectedIndex >= 0 && selectedIndex < selectedItems.length) {
			selectedViewport.current?.children[selectedIndex]?.scrollIntoView({
				block: 'nearest',
			});
		}
	}, [selectedIndex, selectedItems.length]);

	const renderOption = (
		item: DropdownItem,
		index: number,
		style?: CSSProperties,
	) => (
		<Combobox.Option
			key={item.value}
			id={`${id}-${item.value}`}
			value={item.value}
			selected={selectedIndex === index}
			aria-selected={item.isRefined}
			aria-posinset={index + 1}
			aria-setsize={items.length}
			style={{ height: 44, ...style }}
		>
			<Group gap="sm" wrap="nowrap" h="100%" w="100%">
				<Checkbox.Indicator checked={item.isRefined} aria-hidden />
				<span className={classes.option}>{item.label}</span>
			</Group>
		</Combobox.Option>
	);

	return (
		<Combobox
			store={combobox}
			position="bottom-start"
			shadow="xs"
			transitionProps={{ duration: 100, transition: 'fade' }}
			classNames={{ dropdown: classes.dropdown, option: classes.item }}
			width={dropdownWidth ?? w ?? rem(250)}
			resetSelectionOnOptionHover={false}
			onOptionSubmit={submit}
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
						aria-activedescendant={
							selectedIndex >= 0 ? `${id}-${activeValue}` : undefined
						}
					/>
				)}
				<Combobox.Options
					aria-label={ariaLabel ?? label}
					aria-multiselectable
					className={classes.options}
					style={{ height: search ? 264 : Math.min(items.length * 44, 264) }}
				>
					{selectedItems.length > 0 && (
						<div ref={selectedViewport} className={classes.selectedOptions}>
							{selectedItems.map((item, index) => renderOption(item, index))}
						</div>
					)}
					<div ref={viewport} className={classes.viewport}>
						<div
							style={{
								height: virtualizer.getTotalSize(),
								position: 'relative',
							}}
						>
							{virtualizer.getVirtualItems().map((row) =>
								renderOption(
									availableItems[row.index],
									selectedItems.length + row.index,
									{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										transform: `translateY(${row.start}px)`,
									},
								),
							)}
						</div>
						{availableItems.length === 0 && (
							<Combobox.Empty>
								{selectedItems.length > 0
									? 'No other matches'
									: search
										? 'No matching languages'
										: 'No matches'}
							</Combobox.Empty>
						)}
					</div>
				</Combobox.Options>
			</Combobox.Dropdown>
		</Combobox>
	);
};

export { DropdownCheckbox, DropdownSimple };
