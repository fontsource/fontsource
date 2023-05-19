import type { BoxProps } from '@mantine/core';
import { Box, createStyles, rem, Text } from '@mantine/core';

const useStyles = createStyles((theme) => ({
	wrapper: {
		margin: `${rem(20)} 0`,
		padding: rem(16),
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[5]
				: theme.colors.background[1],

		borderLeft: `${rem(3)} solid ${theme.colors.purple[0]}`,
		borderRadius: '0 4px 4px 0',
	},
}));

export const Blockquote = ({ children, ...others }: BoxProps) => {
	const { classes } = useStyles();

	return (
		<Box component="blockquote" className={classes.wrapper} {...others}>
			<Text>{children}</Text>
		</Box>
	);
};
