import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconUp = ({ stroke, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={20}
			width={20}
			fill="none"
			className={classes.icon}
			{...others}
		>
			<title>Up Arrow Icon</title>
			<path
				stroke={stroke ?? '#fff'}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={3.5}
				d="M4.8 2.4h14.4M17 14l-5-5-5 5M12 9v12"
			/>
		</svg>
	);
};

export { IconUp };
