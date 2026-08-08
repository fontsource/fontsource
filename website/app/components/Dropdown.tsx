import {
	Badge,
	Checkbox,
	ComboboxPopover,
	Group,
	rem,
	UnstyledButton,
} from '@mantine/core';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

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
	searchPlaceholder?: string;
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
	searchPlaceholder,
	refine,
}: DropdownProps) {
	const targetRef = useRef<HTMLButtonElement>(null);
	const [dropdownOpened, setDropdownOpened] = useState(false);
	const selected = items.find((item) => item.isRefined)?.value ?? null;
	const data = useMemo(
		() =>
			items.map(({ label: itemLabel, value }) => ({
				label: itemLabel,
				value,
			})),
		[items],
	);
	useEffect(() => {
		if (!dropdownOpened || !searchPlaceholder) return;

		const timer = window.setTimeout(() => {
			// ComboboxPopover does not expose search input props, so follow the
			// target's aria-controls relationship once the popover has mounted.
			const optionsId = targetRef.current?.getAttribute('aria-controls');
			const searchInput = optionsId
				? document.querySelector<HTMLInputElement>(
						`input[aria-controls="${CSS.escape(optionsId)}"]`,
					)
				: null;
			if (searchInput) searchInput.placeholder = searchPlaceholder;
		}, 0);

		return () => window.clearTimeout(timer);
	}, [dropdownOpened, searchPlaceholder]);

	return (
		<ComboboxPopover
			data={data}
			value={selected}
			allowDeselect={false}
			searchable={searchable}
			onDropdownOpen={
				searchPlaceholder ? () => setDropdownOpened(true) : undefined
			}
			onDropdownClose={
				searchPlaceholder ? () => setDropdownOpened(false) : undefined
			}
			nothingFoundMessage={searchable ? 'No matches' : undefined}
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
					ref={targetRef}
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
	const data = useMemo(
		() =>
			items.map(({ label: itemLabel, value }) => ({
				label: itemLabel,
				value,
			})),
		[items],
	);
	const itemByValue = useMemo(
		() => new Map(items.map((item) => [item.value, item])),
		[items],
	);
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
			data={data}
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
					className={classes.input}
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
