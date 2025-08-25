import {
	ActionIcon,
	Group,
	Text,
	Tooltip,
	UnstyledButton,
	useComputedColorScheme,
	useMantineColorScheme,
	useMantineTheme,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';

import type { IconProps } from '@/components/icons';
import { IconMoon, IconSun } from '@/components/icons';

import classes from './ThemeButton.module.css';

export const ThemeButton = ({ ...others }: IconProps) => {
	const { setColorScheme } = useMantineColorScheme();
	const colorScheme = useComputedColorScheme('light');
	const dark = colorScheme === 'dark';

	return (
		<Tooltip label={dark ? 'Light mode' : 'Dark mode'}>
			<ActionIcon
				variant="transparent"
				onClick={() => {
					setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
				}}
			>
				{dark ? <IconSun {...others} /> : <IconMoon {...others} />}
			</ActionIcon>
		</Tooltip>
	);
};

export const ThemeButtonMobile = ({ ...others }: IconProps) => {
	const { setColorScheme } = useMantineColorScheme();
	const colorScheme = useComputedColorScheme('light');

	const dark = colorScheme === 'dark';
	const { hovered, ref } = useHover<HTMLButtonElement>();
	const theme = useMantineTheme();

	return (
		<UnstyledButton
			className={classes.button}
			onClick={() => {
				setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
			}}
			// @ts-expect-error - TODO: fix react 19
			ref={ref}
		>
			<Group gap="xs">
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
