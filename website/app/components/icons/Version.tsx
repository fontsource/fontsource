import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconVersion = ({ height, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const stroke =
		theme.colorScheme === 'dark' ? theme.colors.text[0] : theme.colors.text[1];

	return (
		<svg
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<path
				d="M6.75 2C6.75 1.30964 7.30964 0.75 8 0.75H18C18.6904 0.75 19.25 1.30964 19.25 2V18C19.25 18.6904 18.6904 19.25 18 19.25H8C7.30964 19.25 6.75 18.6904 6.75 18V2Z"
				stroke={stroke}
				strokeWidth="1.5"
			/>
			<path
				d="M4 3.5H2C1.44772 3.5 1 3.94772 1 4.5V16C1 16.5523 1.44772 17 2 17H4"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
};

export { IconVersion };
