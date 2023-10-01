import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconMoon = ({ height, stroke, ...others }: IconProps) => {
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
				d="M17.5 10.658A7.5 7.5 0 1 1 9.342 2.5a5.833 5.833 0 0 0 8.158 8.158v0Z"
			/>
		</svg>
	);
};

export { IconMoon };
