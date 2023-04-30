import {
	ActionIcon,
	Box,
	createStyles,
	Flex,
	Group,
	rem,
	Slider,
	Text,
} from '@mantine/core';

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		flexDirection: 'column',
		width: rem(332),
		padding: rem(24),
	},

	scrollWrapper: {
		border: `1px solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',
	},

	title: {
		fontSize: theme.fontSizes.sm,
		fontWeight: 700,
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		lineHeight: rem(18),
	},
}));


const LeftSidebar = () => {
	const { classes } = useStyles();
	return (
		<Flex className={classes.wrapper}>
			Sidebar
		</Flex>
	);
};

export { LeftSidebar };
