import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconVersion = ({ height, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 20}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<g strokeWidth={1.5} clipPath="url(#a)">
				<path d="M6.75 2c0-.69.56-1.25 1.25-1.25h10c.69 0 1.25.56 1.25 1.25v16c0 .69-.56 1.25-1.25 1.25H8c-.69 0-1.25-.56-1.25-1.25V2Z" />
				<path
					strokeLinecap="round"
					d="M4 3.5H2a1 1 0 0 0-1 1V16a1 1 0 0 0 1 1h2"
				/>
			</g>
			<defs>
				<clipPath id="a">
					<path fill="#fff" d="M0 0h20v20H0z" />
				</clipPath>
			</defs>
		</svg>
	);
};

export { IconVersion };
