import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconDownload = ({ height, stroke, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const strokeNew = stroke
		? stroke
		: theme.colorScheme === 'dark'
		? theme.colors.text[0]
		: theme.colors.text[1];

	return (
		<svg
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<path
				d="M17.8333 17.5H2.16666"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M5.83334 8.33334L10 12.5L14.1667 8.33334"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M10 12.5V2.5"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export { IconDownload };
