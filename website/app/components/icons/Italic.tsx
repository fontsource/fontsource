import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconItalic = ({ height, ...others }: IconProps) => {
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
				d="M10 15H5"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9 5L14 5"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M11.5596 5.27681L7.08935 15.2232"
				stroke={stroke}
				strokeWidth="1.5"
			/>
		</svg>
	);
};

export { IconItalic };
