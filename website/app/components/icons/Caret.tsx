import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconCaret = ({ height, ...others }: IconProps) => {
  const theme = useMantineTheme();
  const stroke =
    theme.colorScheme === 'dark' ? theme.colors.text[0] : theme.colors.text[1];

  return (
    <svg
      height={height ?? 6}
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...others}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { IconCaret };
