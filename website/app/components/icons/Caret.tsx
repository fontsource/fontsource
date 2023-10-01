import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconCaret = ({ height, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 6}
			viewBox="0 0 10 6"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="m1 1 4 4 4-4"
			/>
		</svg>
	);
};

export { IconCaret };
