import {
	rem,
	ScrollArea,
	Combobox,
	useCombobox,
	InputBase,
	Group,
	Checkbox,
} from '@mantine/core';

import { IconCaret } from '@/components/icons';

import classes from './Dropdown.module.css';
import { ObservablePrimitiveBaseFns } from '@legendapp/state';

interface DropdownBaseProps {
	options: JSX.Element[];
	label: string;
	currentState: string;
	selector: ObservablePrimitiveBaseFns<any>;
	w?: number;
}

interface DropdownItemProps {
	label?: string;
	value: any;
	setValue?: (value: React.SetStateAction<any>) => void;
}

interface DropdownProps {
	label: string;
	items: DropdownItemProps[];
	currentState: string;
	selector: ObservablePrimitiveBaseFns<any>;
	w?: number;
}

const DropdownBase = ({
	label,
	options,
	currentState,
	selector,
	w,
}: DropdownBaseProps) => {
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
		onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
	});

	const handleValueSelect = (val: string) => {
		currentState !== val ? selector.set(val) : selector.set('');
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
					onClick={() => combobox.toggleDropdown()}
					rightSectionPointerEvents="none"
					w={w ?? rem(240)}
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
	selector,
	w,
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
			selector={selector}
			w={w}
		/>
	);
};

const DropdownCheckbox = ({
	label,
	items,
	currentState,
	selector,
	w,
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
			selector={selector}
			w={w}
		/>
	);
};

export { DropdownSimple, DropdownCheckbox };
