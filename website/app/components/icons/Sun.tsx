import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconSun = ({ height, stroke }: IconProps) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" height={height ?? 20} fill="none">
			<title>Sun Icon</title>
			<g
				className={classes.icon}
				stroke={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				clipPath="url(#a)"
			>
				<path d="M10 14.167a4.167 4.167 0 1 0 0-8.334 4.167 4.167 0 0 0 0 8.334ZM10 .833V2.5M10 17.5v1.667M3.517 3.517 4.7 4.7M15.3 15.3l1.183 1.183M.833 10H2.5M17.5 10h1.667M3.517 16.483 4.7 15.3M15.3 4.7l1.183-1.183" />
			</g>
			<defs>
				<clipPath id="a">
					<path fill="#fff" d="M0 0h20v20H0z" />
				</clipPath>
			</defs>
		</svg>
	);
};

export { IconSun };
