import {
	ActionIcon,
	Group,
	rem,
	Text,
	Tooltip,
	UnstyledButton,
	useMantineColorScheme,
	useMantineTheme,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';

import type { IconProps } from '@/components';
import { IconMoon, IconSun } from '@/components';

export const ThemeButton = ({ ...others }: IconProps) => {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();
	const dark = colorScheme === 'dark';

	return (
		<Tooltip label={dark ? 'Light mode' : 'Dark mode'}>
			<ActionIcon variant="transparent" onClick={() => toggleColorScheme()}>
				{dark ? <IconSun {...others} /> : <IconMoon {...others} />}
			</ActionIcon>
		</Tooltip>
	);
};

export const ThemeButtonMobile = ({ ...others }: IconProps) => {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();
	const dark = colorScheme === 'dark';
	const { hovered, ref } = useHover<HTMLButtonElement>();
	const theme = useMantineTheme();

	return (
		<UnstyledButton
			onClick={() => toggleColorScheme()}
			sx={(theme) => ({
				display: 'flex',
				alignItems: 'center',
				marginLeft: rem(-5),
				'&:hover': {
					color: theme.colors.purple[0],
				},
			})}
			ref={ref}
		>
			<Group spacing="xs">
				<ActionIcon
					variant="transparent"
					aria-label={dark ? 'Light mode' : 'Dark mode'}
				>
					{dark ? (
						<IconSun
							stroke={hovered ? theme.colors.purple[0] : undefined}
							{...others}
						/>
					) : (
						<IconMoon
							stroke={hovered ? theme.colors.purple[0] : undefined}
							{...others}
							{...others}
						/>
					)}
				</ActionIcon>
				<Text>{dark ? 'Light Mode' : 'Dark Mode'}</Text>
			</Group>
		</UnstyledButton>
	);
};
