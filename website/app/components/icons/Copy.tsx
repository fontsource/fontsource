import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

export const IconCopy = ({ height, stroke, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const strokeNew =
		stroke ??
		(theme.colorScheme === 'dark'
			? theme.colors.text[0]
			: theme.colors.text[1]);

	return (
		<svg
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<g>
				<path
					d="M16.6667 7.5H9.16667C8.24619 7.5 7.5 8.24619 7.5 9.16667V16.6667C7.5 17.5871 8.24619 18.3333 9.16667 18.3333H16.6667C17.5871 18.3333 18.3333 17.5871 18.3333 16.6667V9.16667C18.3333 8.24619 17.5871 7.5 16.6667 7.5Z"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M4.16666 12.5H3.33332C2.8913 12.5 2.46737 12.3244 2.15481 12.0118C1.84225 11.6993 1.66666 11.2754 1.66666 10.8333V3.33332C1.66666 2.8913 1.84225 2.46737 2.15481 2.15481C2.46737 1.84225 2.8913 1.66666 3.33332 1.66666H10.8333C11.2754 1.66666 11.6993 1.84225 12.0118 2.15481C12.3244 2.46737 12.5 2.8913 12.5 3.33332V4.16666"
					stroke={strokeNew}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>
		</svg>
	);
};
