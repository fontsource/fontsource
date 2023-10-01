import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconRotate = ({ height, ...others }: IconProps) => {
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
				d="M.833 3.333v5h5"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M2.925 12.5A7.5 7.5 0 1 0 4.7 4.7L.833 8.333"
			/>
		</svg>
	);
};

export { IconRotate };
