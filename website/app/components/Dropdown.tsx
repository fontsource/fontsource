import {
	type BoxProps,
	Menu,
	rem,
	ScrollArea,
	UnstyledButton,
} from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';

import { IconCaret } from '@/components';

import classes from './Dropdown.module.css';

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
	setValue: (value: React.SetStateAction<any>) => void;
}

const DropdownItem = ({ label, value, setValue }: DropdownItemProps) => {
	return (
		<Menu.Item
			className={classes.item}
			component="button"
			onClick={() => {
				setValue(value);
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

export { Dropdown, DropdownItem };
