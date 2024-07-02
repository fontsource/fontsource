import classes from './Icon.module.css';
import type { IconProps } from './types';

export const IconCopy = ({ height, stroke, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 20}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<title>Copy Icon</title>
			<g
				stroke={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				clipPath="url(#a)"
			>
				<path d="M16.667 7.5h-7.5c-.92 0-1.667.746-1.667 1.667v7.5c0 .92.746 1.666 1.667 1.666h7.5c.92 0 1.666-.746 1.666-1.666v-7.5c0-.92-.746-1.667-1.666-1.667Z" />
				<path d="M4.167 12.5h-.834a1.667 1.667 0 0 1-1.666-1.667v-7.5a1.667 1.667 0 0 1 1.666-1.666h7.5A1.666 1.666 0 0 1 12.5 3.333v.834" />
			</g>
			<defs>
				<clipPath id="a">
					<path fill="#fff" d="M0 0h20v20H0z" />
				</clipPath>
			</defs>
		</svg>
	);
};
