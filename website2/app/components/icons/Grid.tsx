import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconGrid = ({ height, active, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const { colorScheme } = useMantineColorScheme();
	const baseStroke =
		colorScheme === 'dark' ? theme.colors.text[0] : theme.colors.text[1];
	const stroke = active ? theme.colors.purple[0] : baseStroke;

	return (
		<svg
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<path
				d="M8.33333 2.5H2.5V8.33333H8.33333V2.5Z"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M17.5 2.5H11.6667V8.33333H17.5V2.5Z"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M17.5 11.6667H11.6667V17.5H17.5V11.6667Z"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M8.33333 11.6667H2.5V17.5H8.33333V11.6667Z"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export { IconGrid };
