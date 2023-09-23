import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconRotate = ({ height, ...others }: IconProps) => {
	const theme = useMantineTheme();
	const { colorScheme } = useMantineColorScheme();
	const stroke =
		colorScheme === 'dark' ? theme.colors.text[0] : theme.colors.text[1];

	return (
		<svg
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...others}
		>
			<path
				d="M0.833328 3.33334V8.33334H5.83333"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M2.92499 12.5C3.46532 14.0337 4.48944 15.3502 5.84304 16.2512C7.19664 17.1522 8.8064 17.5888 10.4298 17.4954C12.0531 17.402 13.6021 16.7835 14.8434 15.7331C16.0847 14.6828 16.951 13.2575 17.3118 11.672C17.6727 10.0865 17.5084 8.42664 16.8438 6.94259C16.1793 5.45854 15.0504 4.23067 13.6274 3.44398C12.2043 2.65729 10.5641 2.35439 8.95389 2.58094C7.3437 2.80748 5.85076 3.55119 4.69999 4.70001L0.833328 8.33334"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export { IconRotate };
