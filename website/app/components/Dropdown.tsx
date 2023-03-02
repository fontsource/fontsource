import type { DefaultProps } from '@mantine/core';
import { Button, createStyles, Menu, rem, ScrollArea } from '@mantine/core';

import { IconCaret } from '@/components';

interface DropdownProps {
	label: string;
	width?: number | string;
	children: React.ReactNode;
	className?: DefaultProps['className'];
	icon?: React.ReactNode;
}

interface DropdownItemProps {
	value: any;
	setValue: (value: React.SetStateAction<any>) => void;
}

const useStyles = createStyles((theme) => ({
	button: {
		padding: `${rem(2)} ${rem(16)}`,
		height: rem(40),
		border: `${rem(1)} solid ${theme.colorScheme === 'dark'
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

		'&:not([data-disabled])': theme.fn.hover({
			backgroundColor: theme.fn.lighten(theme.colors.purple[0], 0.95),
		}),
	},
}));

const DropdownItem = ({ value, setValue }: DropdownItemProps) => {
	return (
		<Menu.Item
			component="button"
			onClick={() => {
				setValue(value);
			}}
		>
			{value}
		</Menu.Item>
	);
};

const Dropdown = ({
	label,
	icon,
	width,
	className,
	children,
}: DropdownProps) => {
	const { classes } = useStyles();
	return (
		<Menu shadow="md" width={rem(width) ?? rem(240)} closeOnItemClick={false}>
			<Menu.Target>
				<Button
					className={className ?? classes.button}
					variant="subtle"
					rightIcon={icon ?? <IconCaret />}
					styles={{
						root: {
							width: rem(width) ?? rem(240),
						},
						inner: {
							justifyContent: 'space-between',
						},
					}}
				>
					{label}
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				<ScrollArea.Autosize mah={rem(240)}>{children}</ScrollArea.Autosize>
			</Menu.Dropdown>
		</Menu>
	);
};

export { Dropdown, DropdownItem };
