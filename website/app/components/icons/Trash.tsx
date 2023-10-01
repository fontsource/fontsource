import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconTrash = ({ height, ...others }: IconProps) => {
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
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M2 5h16M16.833 5l-1 11.667a1.667 1.667 0 0 1-1.666 1.666H5.833a1.667 1.667 0 0 1-1.666-1.666L3.167 5m3.5 0V3.333a1.667 1.667 0 0 1 1.666-1.666h3.334a1.667 1.667 0 0 1 1.666 1.666V5M8.333 9.167v5M11.667 9.167v5"
			/>
		</svg>
	);
};

export { IconTrash };
