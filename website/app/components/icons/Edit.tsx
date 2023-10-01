import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconEdit = ({ height, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 20}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<g
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				clipPath="url(#a)"
			>
				<path d="M9.167 3.333H3.333A1.667 1.667 0 0 0 1.667 5v11.667a1.667 1.667 0 0 0 1.666 1.666H15a1.667 1.667 0 0 0 1.667-1.666v-5.834" />
				<path d="M15.417 2.083a1.768 1.768 0 1 1 2.5 2.5L10 12.5l-3.333.833L7.5 10l7.917-7.917Z" />
			</g>
			<defs>
				<clipPath id="a">
					<path fill="#fff" d="M0 0h20v20H0z" />
				</clipPath>
			</defs>
		</svg>
	);
};

export { IconEdit };
