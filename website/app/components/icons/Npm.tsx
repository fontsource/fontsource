import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconNpm = ({ height, stroke, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const { colorScheme } = useMantineColorScheme();
	const strokeNew =
		stroke ??
		(colorScheme === 'dark' ? theme.colors.text[0] : theme.colors.text[1]);

	return (
		<svg
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<path
				d="M1 19H10V5.5H14.5V19H19V1H1V19Z"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export { IconNpm };
