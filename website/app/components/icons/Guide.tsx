import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconGuide = ({ height, stroke, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 20}
			fill="none"
			viewBox="0 0 20 20"
			className={classes.icon}
			{...others}
		>
			<title>Guide Icon</title>
			<path
				stroke={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M3.333 16.25a2.083 2.083 0 0 1 2.084-2.083h11.25"
			/>
			<path
				stroke={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M5.417 1.667h11.25v16.666H5.417a2.083 2.083 0 0 1-2.084-2.083V3.75a2.083 2.083 0 0 1 2.084-2.083v0Z"
			/>
		</svg>
	);
};

export { IconGuide };
