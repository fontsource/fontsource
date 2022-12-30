import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconEye = ({ height, ...others }: IconProps) => {
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
				d="M1.33205 10.8638C0.997513 10.3305 0.997513 9.66951 1.33205 9.13625C2.46339 7.33287 5.48178 3.33334 10 3.33334C14.5182 3.33334 17.5366 7.33287 18.6679 9.13625C19.0025 9.66951 19.0025 10.3305 18.6679 10.8638C17.5366 12.6672 14.5182 16.6667 10 16.6667C5.48178 16.6667 2.46339 12.6672 1.33205 10.8638Z"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export { IconEye };
