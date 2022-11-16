import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core';

import { IconMoon, IconSun } from '@/components';

export const ThemeButton = ({ ...others }) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <Tooltip label={dark ? 'Light mode' : 'Dark mode'}>
      <ActionIcon
        variant="subtle"
        onClick={() => toggleColorScheme()}
        {...others}
      >
        {dark ? <IconSun /> : <IconMoon />}
      </ActionIcon>
    </Tooltip>
  );
};
