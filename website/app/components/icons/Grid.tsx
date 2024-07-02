import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconGrid = ({ height, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 18}
			viewBox="0 0 20 20"
			fill="none"
			className={classes.icon}
			{...others}
		>
			<title>Grid Icon</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M8.333 2.5H2.5v5.833h5.833V2.5ZM17.5 2.5h-5.833v5.833H17.5V2.5ZM17.5 11.667h-5.833V17.5H17.5v-5.833ZM8.333 11.667H2.5V17.5h5.833v-5.833Z"
			/>
		</svg>
	);
};

export { IconGrid };
