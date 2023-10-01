import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconEye = ({ height, ...others }: IconProps) => {
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
				d="M1.332 10.864a1.612 1.612 0 0 1 0-1.728C2.463 7.333 5.482 3.333 10 3.333c4.518 0 7.537 4 8.668 5.803a1.612 1.612 0 0 1 0 1.728c-1.131 1.803-4.15 5.803-8.668 5.803-4.518 0-7.537-4-8.668-5.803Z"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
			/>
		</svg>
	);
};

export { IconEye };
