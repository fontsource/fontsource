import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconDownload = ({ height, stroke, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 20}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<path
				stroke={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M17.833 17.5H2.167M5.833 8.333 10 12.5l4.167-4.167M10 12.5v-10"
			/>
		</svg>
	);
};

export { IconDownload };
