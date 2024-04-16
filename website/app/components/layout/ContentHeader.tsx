import type { ContainerProps } from '@mantine/core';
import { Box, Container } from '@mantine/core';

import classes from './ContentHeader.module.css';

export const ContentHeader = ({ ...other }: ContainerProps) => {
	return (
		<Box component="header" className={classes.header}>
			<Container className={classes.inner} {...other} />
		</Box>
	);
};
