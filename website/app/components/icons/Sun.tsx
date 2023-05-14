import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconSun = ({ height, stroke, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const strokeNew =
		stroke ?? theme.colorScheme === 'dark'
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
			<g clipPath="url(#clip0_644_1762)">
				<path
					d="M10 14.1667C12.3012 14.1667 14.1667 12.3012 14.1667 10C14.1667 7.69882 12.3012 5.83334 10 5.83334C7.69882 5.83334 5.83334 7.69882 5.83334 10C5.83334 12.3012 7.69882 14.1667 10 14.1667Z"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M10 0.833344V2.50001"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M10 17.5V19.1667"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M3.51666 3.51666L4.7 4.7"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M15.3 15.3L16.4833 16.4833"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M0.833344 10H2.50001"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M17.5 10H19.1667"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M3.51666 16.4833L4.7 15.3"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M15.3 4.7L16.4833 3.51666"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>
			<defs>
				<clipPath id="clip0_644_1762">
					<rect width="20" height="20" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export { IconSun };
