import type { DefaultProps } from '@mantine/core';
import {
	createStyles,
	Menu,
	rem,
	ScrollArea,
	UnstyledButton,
} from '@mantine/core';

import { IconCaret } from '@/components';

interface DropdownProps {
	label: string;
	width?: number | string;
	children: React.ReactNode;
	className?: DefaultProps['className'];
	icon?: React.ReactNode;
	closeOnItemClick?: boolean;
}

interface DropdownItemProps {
	label?: string;
	value: any;
	setValue: (value: React.SetStateAction<any>) => void;
}

const useStyles = createStyles((theme) => ({
	button: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: `${rem(2)} ${rem(16)}`,
		height: rem(40),
		border: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',

		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],

		fontWeight: 400,

		'&:hover': {
			backgroundColor:
				theme.colorScheme === 'dark'
					? theme.fn.darken(theme.colors.background[4], 0.2)
					: theme.fn.lighten(theme.colors.purple[0], 0.95),
		},
	},
}));

const DropdownItem = ({ label, value, setValue }: DropdownItemProps) => {
	return (
		<Menu.Item
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
	children,
}: DropdownProps) => {
	const { classes } = useStyles();
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
				>
					{label} {icon ?? <IconCaret />}
				</UnstyledButton>
			</Menu.Target>
			<Menu.Dropdown>
				<ScrollArea.Autosize mah={rem(240)}>{children}</ScrollArea.Autosize>
			</Menu.Dropdown>
		</Menu>
	);
};

export { Dropdown, DropdownItem };
