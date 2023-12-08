import {
	Checkbox,
	Combobox,
	Group,
	InputBase,
	rem,
	ScrollArea,
	useCombobox,
} from '@mantine/core';

import { IconCaret } from '@/components/icons';

import classes from './Dropdown.module.css';

interface DropdownBaseProps {
	options: JSX.Element[];
	label: string;
	currentState: string | number;
	refine?: (value: string) => void;
	w?: number | string;
	noBorder?: boolean;
}

interface DropdownItemProps {
	label?: string;
	value: any;
	setValue?: (value: React.SetStateAction<any>) => void;
}

interface DropdownProps {
	label: string;
	items: DropdownItemProps[];
	currentState: string | number;
	refine?: (value: string) => void;
	w?: number | string;
	noBorder?: boolean;
}

const DropdownBase = ({
	label,
	options,
	w,
	noBorder,
	refine,
}: DropdownBaseProps) => {
	const combobox = useCombobox({
		onDropdownClose: () => {
			combobox.resetSelectedOption();
		},
		onDropdownOpen: () => {
			combobox.updateSelectedOptionIndex('active');
		},
	});

	const handleValueSelect = (val: string) => {
		if (refine) refine(val);
	};

	return (
		<Combobox
			store={combobox}
			onOptionSubmit={handleValueSelect}
			withinPortal={false}
			transitionProps={{ duration: 100, transition: 'fade' }}
			width={w ?? rem(240)}
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
					w={w ?? rem(240)}
					data-no-border={noBorder}
				>
					{label}
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

const DropdownSimple = ({
	label,
	items,
	currentState,
	w,
	noBorder,
	refine,
}: DropdownProps) => {
	const options = items.map((item) => (
		<Combobox.Option
			value={item.value}
			key={item.value}
			active={currentState === item.value}
		>
			{item.label ?? item.value}
		</Combobox.Option>
	));

	return (
		<DropdownBase
			label={label}
			options={options}
			currentState={currentState}
			refine={refine}
			w={w}
			noBorder={noBorder}
		/>
	);
};

const DropdownCheckbox = ({
	label,
	items,
	currentState,
	w,
	noBorder,
}: DropdownProps) => {
	const options = items.map((item) => (
		<Combobox.Option
			value={item.value}
			key={item.value}
			active={currentState === item.value}
		>
			<Group gap="sm" justify="flex-start">
				<Checkbox
					checked={currentState === item.value}
					aria-hidden
					tabIndex={-1}
					style={{ pointerEvents: 'none' }}
					readOnly
				/>
				<span className={classes.option}>{item.label ?? item.value}</span>
			</Group>
		</Combobox.Option>
	));

	return (
		<DropdownBase
			label={label}
			options={options}
			currentState={currentState}
			w={w}
			noBorder={noBorder}
		/>
	);
};

export { DropdownCheckbox, DropdownSimple };
