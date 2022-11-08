import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconList = ({ height, ...others }: IconProps) => {
  const theme = useMantineTheme();
  const stroke =
    theme.colorScheme === 'dark' ? theme.colors.text[0] : theme.colors.text[1];

  return (
    <svg height={height ?? 18} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...others}>
        <path d="M6.66667 5H17.5" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.66667 10H17.5" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.66667 15H17.5" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2.5 5H2.50833" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2.5 10H2.50833" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2.5 15H2.50833" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  );
};

export { IconList };