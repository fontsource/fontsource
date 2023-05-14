import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core';

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
