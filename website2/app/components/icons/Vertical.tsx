import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconVertical = ({ height, ...others }: IconProps) => {
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
				d="M18 19H2"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M2 1L18 1"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M13.042 13.7842L12.5293 12.4365H8.16406L7.65137 13.8135C7.45117 14.3506 7.28027 14.7144 7.13867 14.9048C6.99707 15.0903 6.76514 15.1831 6.44287 15.1831C6.16943 15.1831 5.92773 15.083 5.71777 14.8828C5.50781 14.6826 5.40283 14.4556 5.40283 14.2017C5.40283 14.0552 5.42725 13.9038 5.47607 13.7476C5.5249 13.5913 5.60547 13.374 5.71777 13.0957L8.46436 6.12305C8.54248 5.92285 8.63525 5.68359 8.74268 5.40527C8.85498 5.12207 8.97217 4.8877 9.09424 4.70215C9.22119 4.5166 9.38477 4.36768 9.58496 4.25537C9.79004 4.13818 10.0415 4.07959 10.3394 4.07959C10.6421 4.07959 10.8936 4.13818 11.0938 4.25537C11.2988 4.36768 11.4624 4.51416 11.5845 4.69482C11.7114 4.87549 11.8164 5.0708 11.8994 5.28076C11.9873 5.48584 12.0972 5.76172 12.229 6.1084L15.0342 13.0371C15.2539 13.5645 15.3638 13.9478 15.3638 14.187C15.3638 14.436 15.2588 14.6655 15.0488 14.8755C14.8438 15.0806 14.5947 15.1831 14.3018 15.1831C14.1309 15.1831 13.9844 15.1514 13.8623 15.0879C13.7402 15.0293 13.6377 14.9487 13.5547 14.8462C13.4717 14.7388 13.3813 14.5776 13.2837 14.3628C13.1909 14.1431 13.1104 13.9502 13.042 13.7842ZM8.73535 10.8032H11.9434L10.3247 6.37207L8.73535 10.8032Z"
				fill={stroke}
			/>
		</svg>
	);
};

export { IconVertical };
