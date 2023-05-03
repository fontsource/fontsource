import {
	createStyles,
	rem,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { Link } from '@remix-run/react';

import type { HeadingsData } from '@/hooks/useHeadingsData';
import { useHeadingsData } from '@/hooks/useHeadingsData';

const useStyles = createStyles((theme) => ({
	nav: {
		marginTop: rem(40),
	},

	wrapper: {
		boxSizing: 'border-box',
		paddingLeft: theme.spacing.md,
		position: 'sticky',
		top: theme.spacing.xl,
		right: 0,
		marginTop: rem(10),
		borderLeft: `1px solid ${theme.colors.gray[2]}`,
	},

	nestedWrapper: {
		boxSizing: 'border-box',
		paddingLeft: theme.spacing.md,
		position: 'sticky',
		top: theme.spacing.xl,
		right: 0,
	},
}));

const HeadingItem = (heading: HeadingsData) => {
	const { classes } = useStyles();

	return (
		<>
			<UnstyledButton key={heading.id} component={Link} to={`#${heading.id}`}>
				<Text>{heading.title}</Text>
			</UnstyledButton>
			<div className={classes.nestedWrapper}>
				{heading.items &&
					heading.items.length > 0 &&
					heading.items.map((child) => (
						<HeadingItem key={child.id} {...child} />
					))}
			</div>
		</>
	);
};

export const TableOfContents = () => {
	const { nestedHeadings } = useHeadingsData();
	const { classes } = useStyles();

	return (
		<nav className={classes.nav}>
			<Text fw={700}>On this page</Text>
			<div className={classes.wrapper}>
				{nestedHeadings.map((heading) => (
					<HeadingItem key={heading.id} {...heading} />
				))}
			</div>
		</nav>
	);
};
