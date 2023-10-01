import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconSearch = ({ height, ...others }: IconProps) => {
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
				className={classes.icon}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM18 18l-5-5"
			/>
		</svg>
	);
};

export { IconSearch };
