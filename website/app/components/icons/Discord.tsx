import { IconBrandDiscord as TablerIcon } from '@tabler/icons-react';

import classes from './Icon.module.css';
import type { IconProps } from './types';

const IconDiscord = ({ height = 20, stroke, style, ...others }: IconProps) => (
	<TablerIcon
		size={height}
		stroke={1.8}
		className={classes.icon}
		style={{ stroke, ...style }}
		{...others}
	>
		<title>Discord Icon</title>
	</TablerIcon>
);

export { IconDiscord };
