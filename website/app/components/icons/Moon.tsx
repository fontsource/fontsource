import { IconMoon as TablerIcon } from '@tabler/icons-react';

import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconMoon = ({ height = 20, stroke, style, ...others }: IconProps) => (
	<TablerIcon
		size={height}
		stroke={1.8}
		className={classes.icon}
		style={{ stroke, ...style }}
		{...others}
	>
		<title>Moon Icon</title>
	</TablerIcon>
);

export { IconMoon };
