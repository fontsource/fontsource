import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconHorizontal = ({ height, ...others }: IconProps) => {
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
				d="M1 17L1 1"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M19 17L19 1"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M13.042 12.7842L12.5293 11.4365H8.16406L7.65137 12.8135C7.45117 13.3506 7.28027 13.7144 7.13867 13.9048C6.99707 14.0903 6.76514 14.1831 6.44287 14.1831C6.16943 14.1831 5.92773 14.083 5.71777 13.8828C5.50781 13.6826 5.40283 13.4556 5.40283 13.2017C5.40283 13.0552 5.42725 12.9038 5.47607 12.7476C5.5249 12.5913 5.60547 12.374 5.71777 12.0957L8.46436 5.12305C8.54248 4.92285 8.63525 4.68359 8.74268 4.40527C8.85498 4.12207 8.97217 3.8877 9.09424 3.70215C9.22119 3.5166 9.38477 3.36768 9.58496 3.25537C9.79004 3.13818 10.0415 3.07959 10.3394 3.07959C10.6421 3.07959 10.8936 3.13818 11.0938 3.25537C11.2988 3.36768 11.4624 3.51416 11.5845 3.69482C11.7114 3.87549 11.8164 4.0708 11.8994 4.28076C11.9873 4.48584 12.0972 4.76172 12.229 5.1084L15.0342 12.0371C15.2539 12.5645 15.3638 12.9478 15.3638 13.187C15.3638 13.436 15.2588 13.6655 15.0488 13.8755C14.8438 14.0806 14.5947 14.1831 14.3018 14.1831C14.1309 14.1831 13.9844 14.1514 13.8623 14.0879C13.7402 14.0293 13.6377 13.9487 13.5547 13.8462C13.4717 13.7388 13.3813 13.5776 13.2837 13.3628C13.1909 13.1431 13.1104 12.9502 13.042 12.7842ZM8.73535 9.80322H11.9434L10.3247 5.37207L8.73535 9.80322Z"
				fill={stroke}
			/>
		</svg>
	);
};

export { IconHorizontal };
