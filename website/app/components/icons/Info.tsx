import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconInfo = ({ height, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 20}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<title>Info Icon</title>
			<g
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				clipPath="url(#a)"
			>
				<path d="M10 18.333a8.333 8.333 0 1 0 0-16.666 8.333 8.333 0 0 0 0 16.666ZM10 13.333V10M10 6.667h.01" />
			</g>
			<defs>
				<clipPath id="a">
					<path fill="#fff" d="M0 0h20v20H0z" />
				</clipPath>
			</defs>
		</svg>
	);
};

export { IconInfo };
