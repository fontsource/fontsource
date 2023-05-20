import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconChangelog = ({ height, stroke, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const strokeNew = stroke
		? stroke
		: theme.colorScheme === 'dark'
		? theme.colors.text[0]
		: theme.colors.text[1];

	return (
		<svg
			height={height}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<path
				d="M11.6666 1.66666H4.99998C4.55795 1.66666 4.13403 1.84225 3.82147 2.15481C3.50891 2.46737 3.33331 2.8913 3.33331 3.33332V16.6667C3.33331 17.1087 3.50891 17.5326 3.82147 17.8452C4.13403 18.1577 4.55795 18.3333 4.99998 18.3333H15C15.442 18.3333 15.8659 18.1577 16.1785 17.8452C16.4911 17.5326 16.6666 17.1087 16.6666 16.6667V6.66666L11.6666 1.66666Z"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M11.6667 1.66666V6.66666H16.6667"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M13.3334 10.8333H6.66669"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M10.3334 14.1667H6.66669"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M8.33335 7.5H7.50002H6.66669"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export { IconChangelog };
