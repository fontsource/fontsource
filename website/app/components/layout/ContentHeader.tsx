import type { ContainerProps } from '@mantine/core';
import { Box, Container, createStyles, rem } from '@mantine/core';

const useStyles = createStyles((theme) => ({
	header: {
		background:
			theme.colorScheme === 'dark'
				? theme.colors.background[5]
				: theme.colors.background[1],
	},
	inner: {
		maxWidth: rem(1440),
		marginLeft: 'auto',
		marginRight: 'auto',
		height: rem(144),
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: `${rem(64)} ${rem(64)} ${rem(40)}`,
	},
}));

export const ContentHeader = ({ ...other }: ContainerProps) => {
	const { classes } = useStyles();

	return (
		<Box component="header" className={classes.header}>
			<Container className={classes.inner} {...other} />
		</Box>
	);
};
