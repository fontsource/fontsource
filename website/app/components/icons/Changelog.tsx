import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconChangelog = ({ height, stroke, ...others }: IconProps) => {
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
				d="M11.667 1.667H5a1.667 1.667 0 0 0-1.667 1.666v13.334A1.667 1.667 0 0 0 5 18.333h10a1.667 1.667 0 0 0 1.667-1.666v-10l-5-5Z"
			/>
			<path
				stroke={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M11.667 1.667v5h5M13.333 10.833H6.667M10.333 14.167H6.667M8.333 7.5H6.667"
			/>
		</svg>
	);
};

export { IconChangelog };
