import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconMoon = ({ height, stroke, ...others }: IconProps) => {
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
			<path
				d="M17.5 10.6583C17.3689 12.0768 16.8366 13.4287 15.9652 14.5557C15.0939 15.6826 13.9196 16.5382 12.5798 17.0221C11.2399 17.5061 9.79 17.5984 8.39959 17.2884C7.00919 16.9784 5.73584 16.2788 4.72853 15.2715C3.72122 14.2642 3.02163 12.9908 2.7116 11.6004C2.40157 10.21 2.49394 8.76007 2.97789 7.42025C3.46185 6.08042 4.31737 4.90614 5.44435 4.03479C6.57134 3.16345 7.92317 2.63109 9.34168 2.5C8.51119 3.62356 8.11155 5.00787 8.21545 6.40118C8.31935 7.79448 8.91989 9.10422 9.90784 10.0922C10.8958 11.0801 12.2055 11.6807 13.5988 11.7846C14.9921 11.8885 16.3765 11.4888 17.5 10.6583V10.6583Z"
				stroke={strokeNew}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export { IconMoon };
