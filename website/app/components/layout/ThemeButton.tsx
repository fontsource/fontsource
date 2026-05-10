import {
	ActionIcon,
	Group,
	Text,
	Tooltip,
	UnstyledButton,
	useComputedColorScheme,
	useMantineColorScheme,
} from '@mantine/core';

import type { IconProps } from '@/components/icons';
import { IconMoon, IconSun } from '@/components/icons';

import classes from './ThemeButton.module.css';

const ColorSchemeIcons = (props: IconProps) => (
	<>
		<span className={classes.moonIcon} aria-hidden="true">
			<IconMoon {...props} />
		</span>
		<span className={classes.sunIcon} aria-hidden="true">
			<IconSun {...props} />
		</span>
	</>
);

export const ThemeButton = ({ ...others }: IconProps) => {
	const { setColorScheme } = useMantineColorScheme();
	const colorScheme = useComputedColorScheme('light');

	return (
		<Tooltip label="Toggle color scheme">
			<ActionIcon
				variant="transparent"
				aria-label="Toggle color scheme"
				onClick={() => {
					setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
				}}
			>
				<ColorSchemeIcons {...others} />
			</ActionIcon>
		</Tooltip>
	);
};

export const ThemeButtonMobile = ({ ...others }: IconProps) => {
	const { setColorScheme } = useMantineColorScheme();
	const colorScheme = useComputedColorScheme('light');

	return (
		<UnstyledButton
			className={classes.button}
			aria-label="Toggle color scheme"
			onClick={() => {
				setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
			}}
		>
			<Group gap="xs">
				<span className={classes.mobileIcon} aria-hidden="true">
					<ColorSchemeIcons {...others} />
				</span>
				<Text>
					<span className={classes.lightLabel}>Dark Mode</span>
					<span className={classes.darkLabel}>Light Mode</span>
				</Text>
			</Group>
		</UnstyledButton>
	);
};
