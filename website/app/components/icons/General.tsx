import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconGeneral = ({ height, stroke, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const strokeNew =
		stroke ??
		(theme.colorScheme === 'dark'
			? theme.colors.text[0]
			: theme.colors.text[1]);

	return (
		<svg
			width={height}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<g clipPath="url(#clip0_612_4920)">
				<path
					d="M9.99999 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 9.99999C18.3333 5.39762 14.6024 1.66666 9.99999 1.66666C5.39762 1.66666 1.66666 5.39762 1.66666 9.99999C1.66666 14.6024 5.39762 18.3333 9.99999 18.3333Z"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M1.66666 10H18.3333"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M9.99999 1.66666C12.0844 3.94862 13.269 6.91002 13.3333 9.99999C13.269 13.09 12.0844 16.0514 9.99999 18.3333C7.91559 16.0514 6.73103 13.09 6.66666 9.99999C6.73103 6.91002 7.91559 3.94862 9.99999 1.66666V1.66666Z"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>
			<defs>
				<clipPath id="clip0_612_4920">
					<rect width="20" height="20" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export { IconGeneral };
