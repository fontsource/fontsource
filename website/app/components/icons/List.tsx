import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconList = ({ height, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M6.667 5H17.5M6.667 10H17.5M6.667 15H17.5M2.5 5h.008M2.5 10h.008M2.5 15h.008"
			/>
		</svg>
	);
};

export { IconList };
