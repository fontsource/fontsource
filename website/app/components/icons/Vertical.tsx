import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconVertical = ({ height, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 20}
			viewBox="0 0 20 20"
			fill="none"
			{...others}
		>
			<title>Vertical Icon</title>
			<path
				className={classes.icon}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M18 19H2M2 1h16"
			/>
			<path
				className={classes['icon-fill']}
				d="m13.042 13.784-.513-1.348H8.164l-.513 1.377c-.2.538-.37.901-.512 1.092-.142.185-.374.278-.696.278-.274 0-.515-.1-.725-.3-.21-.2-.315-.427-.315-.681 0-.147.024-.298.073-.454.049-.157.13-.374.242-.652l2.746-6.973.279-.718c.112-.283.23-.517.351-.703.127-.185.29-.334.491-.447.205-.117.456-.175.754-.175.303 0 .555.058.755.175.205.113.368.26.49.44.127.18.232.376.315.586.088.205.198.48.33.827l2.805 6.93c.22.527.33.91.33 1.149 0 .249-.105.479-.315.689a1.017 1.017 0 0 1-.747.307.942.942 0 0 1-.747-.337 2.533 2.533 0 0 1-.271-.483c-.093-.22-.174-.413-.242-.579Zm-4.307-2.98h3.208l-1.618-4.432-1.59 4.431Z"
			/>
		</svg>
	);
};

export { IconVertical };
