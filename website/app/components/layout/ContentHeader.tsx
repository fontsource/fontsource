import type { ContainerProps } from '@mantine/core';
import { Box, Container } from '@mantine/core';

import classes from './ContentHeader.module.css';

export const ContentHeader = ({ ...other }: ContainerProps) => {
	return (
		<Box component="header" className={classes.header}>
			{/* @ts-expect-error - Mantine v7 typing errors */}
			<Container className={classes.inner} {...other} />
		</Box>
	);
};
