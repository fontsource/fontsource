import type { ContainerProps } from '@mantine/core';
import { Box, Container, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

import classes from './ContentHeader.module.css';

type ContentHeaderProps = Omit<ContainerProps, 'children' | 'title'> & {
	actions?: ReactNode;
	children?: ReactNode;
	description?: ReactNode;
	title: ReactNode;
};

export const ContentHeader = ({
	actions,
	children,
	description,
	title,
	...other
}: ContentHeaderProps) => {
	return (
		<Box component="header" className={classes.header}>
			<Container className={classes.inner} {...other}>
				<Box className={classes.content}>
					<Box className={classes.heading}>
						<Title order={1} className={classes.title}>
							{title}
						</Title>
						{actions && <Box className={classes.actions}>{actions}</Box>}
					</Box>
					{description && (
						<Text className={classes.description}>{description}</Text>
					)}
				</Box>
				{children && <Box className={classes.controls}>{children}</Box>}
			</Container>
		</Box>
	);
};
