import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';

import classes from './Blockquote.module.css';

export const Blockquote = ({ ...others }: BoxProps) => {
	return <Box component="blockquote" className={classes.wrapper} {...others} />;
};
