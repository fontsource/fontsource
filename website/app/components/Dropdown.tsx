import {
	Badge,
	Checkbox,
	ComboboxPopover,
	Group,
	rem,
	UnstyledButton,
} from '@mantine/core';
import { useState } from 'react';

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
	search?: (query: string) => void;
}

const DropdownSimple = ({
	label,
	ariaLabel,
	items,
	w,
	dropdownWidth,
	noBorder,
	refine,
}: DropdownProps) => {
	const selected = items.find((item) => item.isRefined)?.value ?? null;

	return (
		<ComboboxPopover
			data={items.map(({ label: itemLabel, value }) => ({
				label: itemLabel,
				value,
			}))}
			value={selected}
			allowDeselect={false}
			maxDropdownHeight={240}
			comboboxProps={{
				position: 'bottom-start',
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
};

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
	const itemByValue = new Map(items.map((item) => [item.value, item]));
	const selected = items
		.filter((item) => item.isRefined)
		.map((item) => item.value);

	const updateSearch = (query: string) => {
		setSearchQuery(query);
		search?.(query);
	};

	return (
		<ComboboxPopover
			multiple
			data={items.map(({ label: itemLabel, value }) => ({
				label: itemLabel,
				value,
			}))}
			value={selected}
			searchable={Boolean(search)}
			searchValue={search ? searchQuery : undefined}
			nothingFoundMessage="No matches"
			withCheckIcon={false}
			maxDropdownHeight={240}
			comboboxProps={{
				position: 'bottom-start',
				transitionProps: { duration: 100, transition: 'fade' },
				width: dropdownWidth ?? w ?? rem(250),
			}}
			onSearchChange={search ? updateSearch : undefined}
			onDropdownClose={() => {
				if (searchQuery) updateSearch('');
			}}
			onOptionSubmit={(value) => refine?.(String(value))}
			renderOption={({ option, checked }) => {
				const item = itemByValue.get(String(option.value));

				return (
					<Group gap="sm" justify="flex-start" wrap="nowrap" w="100%">
						<Checkbox.Indicator checked={checked} aria-hidden />
						<span className={classes.option}>{option.label}</span>
						{showCount && item?.count !== undefined && (
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
				);
			}}
		>
			<ComboboxPopover.Target>
				<UnstyledButton
					type="button"
					aria-label={ariaLabel ?? label}
					className={`${classes.input} ${classes.checkboxInput}`}
					w={w ?? rem(250)}
					data-no-border={noBorder}
					disabled={items.length === 0 && !search}
				>
					<span className={classes.label}>{label}</span>
					<IconCaret className={classes.caret} aria-hidden="true" />
				</UnstyledButton>
			</ComboboxPopover.Target>
		</ComboboxPopover>
	);
};

export { DropdownCheckbox, DropdownSimple };
