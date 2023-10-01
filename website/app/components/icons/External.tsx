import type { IconProps } from './types';

const IconExternal = ({ height, stroke, ...others }: IconProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height={height ?? 18}
			viewBox="0 0 24 24"
			fill="none"
			stroke={stroke ?? 'currentColor'}
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			{...others}
		>
			<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
		</svg>
	);
};

export { IconExternal };
