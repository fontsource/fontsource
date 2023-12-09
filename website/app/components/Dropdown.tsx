import {
	Badge,
	Checkbox,
	Combobox,
	Group,
	InputBase,
	rem,
	ScrollArea,
	useCombobox,
} from '@mantine/core';
import { useState } from 'react';

import { IconCaret } from '@/components/icons';

import classes from './Dropdown.module.css';

interface DropdownBaseProps {
	options: JSX.Element[];
	label: string;
	refine?: (value: string) => void;
	w?: number | string;
	noBorder?: boolean;
	search?: (query: string) => void;
}
interface DropdownItems {
	label: string;
	value: string;
	isRefined: boolean;
	count?: number;
}
interface DropdownProps {
	label: string;
	items: DropdownItems[];
	refine?: (value: string) => void;
	w?: number | string;
	noBorder?: boolean;
	showCount?: boolean;
	search?: (query: string) => void;
}

const DropdownBase = ({
	label,
	options,
	w,
	noBorder,
	refine,
	search,
}: DropdownBaseProps) => {
	const [searchQuery, setSearchQuery] = useState('');

	const combobox = useCombobox({
		onDropdownClose: () => {
			combobox.resetSelectedOption();
			combobox.focusTarget();
			setSearchQuery('');
		},
		onDropdownOpen: () => {
			combobox.updateSelectedOptionIndex('active');
			if (search) {
				combobox.focusSearchInput();
			}
		},
	});

	const handleValueSelect = (val: string) => {
		if (refine) refine(val);
	};

	const handleSearchQuery = (query: string) => {
		if (search) {
			search(query);
			setSearchQuery(query);
		}
	};

	return (
		<Combobox
			store={combobox}
			onOptionSubmit={handleValueSelect}
			withinPortal={false}
			transitionProps={{ duration: 100, transition: 'fade' }}
			width={w ?? rem(250)}
		>
			<Combobox.DropdownTarget>
				<InputBase
					component="button"
					classNames={{ input: classes.input }}
					pointer
					rightSection={<IconCaret />}
					onClick={() => {
						combobox.toggleDropdown();
					}}
					rightSectionPointerEvents="none"
					w={w ?? rem(250)}
					data-no-border={noBorder}
				>
					{label}
				</InputBase>
			</Combobox.DropdownTarget>

			<Combobox.Dropdown>
				{search && (
					<Combobox.Search
						value={searchQuery}
						onChange={(event) => {
							handleSearchQuery(event.currentTarget.value);
						}}
						placeholder="Search languages"
					/>
				)}
				<Combobox.Options>
					<ScrollArea.Autosize type="scroll" mah={240}>
						{options}
					</ScrollArea.Autosize>
				</Combobox.Options>
			</Combobox.Dropdown>
		</Combobox>
	);
};

const DropdownSimple = ({
	label,
	items,
	w,
	noBorder,
	refine,
}: DropdownProps) => {
	const options = items.map((item) => (
		<Combobox.Option
			value={item.value}
			key={item.value}
			active={item.isRefined}
		>
			{item.label ?? item.value}
		</Combobox.Option>
	));

	return (
		<DropdownBase
			label={label}
			options={options}
			refine={refine}
			w={w}
			noBorder={noBorder}
		/>
	);
};

const DropdownCheckbox = ({
	label,
	items,
	w,
	noBorder,
	refine,
	showCount,
	search,
}: DropdownProps) => {
	const options = items.map((item) => (
		<Combobox.Option
			value={item.value}
			key={item.value}
			active={item.isRefined}
		>
			<Group gap="sm" justify="flex-start">
				<Checkbox
					checked={item.isRefined}
					aria-hidden
					tabIndex={-1}
					style={{ pointerEvents: 'none' }}
					readOnly
				/>
				<span className={classes.option}>{item.label ?? item.value}</span>
				{showCount && item.count && (
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
	));

	return (
		<DropdownBase
			label={label}
			options={options}
			w={w}
			noBorder={noBorder}
			refine={refine}
			search={search}
		/>
	);
};

export { DropdownCheckbox, DropdownSimple };
