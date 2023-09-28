import {
	ActionIcon,
	Group,
	rem,
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

export const ThemeButton = ({ ...others }: IconProps) => {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();
	const dark = colorScheme === 'dark';

	return (
		<Tooltip label={dark ? 'Light mode' : 'Dark mode'}>
			<ActionIcon
				variant="transparent"
				onClick={() => {
					toggleColorScheme();
				}}
			>
				{/* @ts-expect-error */}
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
			onClick={() => {
				setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
			}}
			style={(theme) => ({
				display: 'flex',
				alignItems: 'center',
				marginLeft: rem(-5),
				'&:hover': {
					color: theme.colors.purple[0],
				},
			})}
			ref={ref}
		>
			<Group gap="xs">
				<ActionIcon
					variant="transparent"
					aria-label={dark ? 'Light mode' : 'Dark mode'}
				>
					{dark ? (
						// @ts-expect-error
						<IconSun
							stroke={hovered ? theme.colors.purple[0] : undefined}
							{...others}
						/>
					) : (
						// @ts-expect-error
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
