import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconItalic = ({ height, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<title>Italic Icon</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M10 15H5M9 5h5"
			/>
			<path strokeWidth={1.5} d="m11.56 5.277-4.47 9.946" />
		</svg>
	);
};

export { IconItalic };
