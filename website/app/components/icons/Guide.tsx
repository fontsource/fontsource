import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconGuide = ({ height, stroke, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const { colorScheme } = useMantineColorScheme();
	const strokeNew =
		stroke ??
		(colorScheme === 'dark' ? theme.colors.text[0] : theme.colors.text[1]);

	return (
		<svg
			height={height}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<path
				d="M3.33334 16.25C3.33334 15.6975 3.55284 15.1676 3.94354 14.7769C4.33424 14.3861 4.86414 14.1667 5.41668 14.1667H16.6667"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M5.41668 1.66666H16.6667V18.3333H5.41668C4.86414 18.3333 4.33424 18.1138 3.94354 17.7231C3.55284 17.3324 3.33334 16.8025 3.33334 16.25V3.74999C3.33334 3.19746 3.55284 2.66755 3.94354 2.27685C4.33424 1.88615 4.86414 1.66666 5.41668 1.66666V1.66666Z"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export { IconGuide };
