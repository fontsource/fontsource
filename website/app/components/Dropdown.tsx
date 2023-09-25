import {
	type BoxProps,
	Menu,
	rem,
	ScrollArea,
	UnstyledButton,
	Combobox,
	useCombobox,
	InputBase,
	Input,
	Group,
	Checkbox,
} from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';

import { IconCaret } from '@/components/icons';

import classes from './Dropdown.module.css';
import { useState } from 'react';
import { ObservablePrimitiveBaseFns } from '@legendapp/state';

interface DropdownProps {
	label: string;
	width?: number | string;
	children: React.ReactNode;
	className?: BoxProps['className'];
	icon?: React.ReactNode;
	capitalize?: boolean;
	closeOnItemClick?: boolean;
}

interface DropdownItemProps {
	label?: string;
	value: any;
	setValue?: (value: React.SetStateAction<any>) => void;
}

interface DropdownCheckboxProps {
	items: DropdownItemProps[];
	currentState: string;
	selector: ObservablePrimitiveBaseFns<any>;
}

const DropdownItem = ({ label, value, setValue }: DropdownItemProps) => {
	return (
		<Menu.Item
			className={classes.item}
			component="button"
			onClick={() => {
				setValue!(value);
			}}
		>
			{label ?? value}
		</Menu.Item>
	);
};

const Dropdown = ({
	label,
	icon,
	width,
	className,
	closeOnItemClick,
	capitalize,
	children,
}: DropdownProps) => {
	const { ref, focused } = useFocusWithin();
	return (
		<Menu
			shadow="md"
			width={rem(width) ?? rem(240)}
			closeOnItemClick={closeOnItemClick ?? true}
		>
			<Menu.Target>
				<UnstyledButton
					className={className ?? classes.button}
					w={rem(width) ?? rem(240)}
					style={(theme) => ({
						textTransform: capitalize ? 'capitalize' : undefined,
						border: focused ? theme.colors.purple[0] : undefined,
					})}
				>
					{label} {icon ?? <IconCaret />}
				</UnstyledButton>
			</Menu.Target>
			<Menu.Dropdown>
				<ScrollArea.Autosize ref={ref} mah={rem(240)}>
					{children}
				</ScrollArea.Autosize>
			</Menu.Dropdown>
		</Menu>
	);
};

const DropdownCheckbox = ({
	items,
	currentState,
	selector,
}: DropdownCheckboxProps) => {
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
		onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
	});

	const handleValueSelect = (val: string) => selector.set(val);

	const handleValueRemove = () => {
		selector.set('');
		combobox.resetSelectedOption();
	};

	const options = items.map((item) => (
		<Combobox.Option
			value={item.value}
			key={item.value}
			active={currentState === item.value}
		>
			<Group gap="sm" justify="flex-start">
				<Checkbox
					checked={currentState === item.value}
					onChange={() => {
						currentState !== item.value
							? handleValueSelect(item.value)
							: handleValueRemove();
					}}
					aria-hidden
					tabIndex={-1}
					style={{ pointerEvents: 'none' }}
				/>
				<span>{item.label ?? item.value}</span>
			</Group>
		</Combobox.Option>
	));

	return (
		<Combobox
			store={combobox}
			onOptionSubmit={handleValueSelect}
			withinPortal={false}
			width={rem(240)}
		>
			<Combobox.DropdownTarget>
				<InputBase
					component="button"
					pointer
					rightSection={<IconCaret />}
					onClick={() => combobox.toggleDropdown()}
					rightSectionPointerEvents="none"
					w={rem(240)}
				>
					{currentState || 'All categories'}
				</InputBase>
			</Combobox.DropdownTarget>

			<Combobox.Dropdown>
				<Combobox.Options>
					<ScrollArea.Autosize type="scroll" mah={240}>
						{options}
					</ScrollArea.Autosize>
				</Combobox.Options>
			</Combobox.Dropdown>
		</Combobox>
	);
};

export { Dropdown, DropdownItem, DropdownCheckbox };
