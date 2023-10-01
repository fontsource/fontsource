import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconGithub = ({ height, stroke, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 20}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			style={{ marginBottom: '-1px' }}
			{...others}
		>
			<path
				stroke={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M13.333 18.333v-3.225a2.807 2.807 0 0 0-.783-2.175c2.617-.291 5.367-1.283 5.367-5.833a4.534 4.534 0 0 0-1.25-3.125 4.225 4.225 0 0 0-.075-3.142s-.984-.291-3.259 1.234a11.15 11.15 0 0 0-5.833 0C5.225.542 4.242.833 4.242.833a4.225 4.225 0 0 0-.075 3.142 4.533 4.533 0 0 0-1.25 3.15c0 4.517 2.75 5.508 5.366 5.833a2.808 2.808 0 0 0-.783 2.15v3.225m0-2.5c-4.167 1.25-4.167-2.083-5.833-2.5l5.833 2.5Z"
			/>
		</svg>
	);
};

export { IconGithub };
