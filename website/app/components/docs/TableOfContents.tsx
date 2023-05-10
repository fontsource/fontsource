import type { TextProps} from '@mantine/core';
import { Box, createStyles, rem, Text, UnstyledButton } from '@mantine/core';
import { Link, useParams } from '@remix-run/react';
import { useState } from 'react';

import type { HeadingsData } from '@/hooks/useHeadingsData';
import { useHeadingsData } from '@/hooks/useHeadingsData';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

const useStyles = createStyles((theme) => ({
	nav: {
		marginTop: rem(30),
		position: 'sticky',
		top: rem(40),
		right: 0,
	},

	wrapper: {
		boxSizing: 'border-box',
		position: 'sticky',
		top: theme.spacing.xl,

		marginTop: rem(10),
	},

	nestedWrapper: {
		boxSizing: 'border-box',
	},
}));

interface HeadingItemProps extends HeadingsData, TextProps {
	active: string;
}

const HeadingItem = (heading: HeadingItemProps) => {
	const { classes } = useStyles();
	const isActive = heading.active === heading.id;

	return (
		<>
			<Box
				sx={(theme) => ({
					borderLeft: isActive
						? `${rem(1)} solid ${theme.colors.purple[0]}`
						: `${rem(1)} solid ${theme.colors.gray[2]}`,
				})}
			>
				<UnstyledButton key={heading.id} component={Link} to={`#${heading.id}`}>
					<Text fz={15} fw={isActive ? 700 : 400} pl={heading.pl ?? 16} py={4}>{heading.title}</Text>
				</UnstyledButton>
			</Box>
			<div className={classes.nestedWrapper}>
				{heading.items &&
					heading.items.length > 0 &&
					heading.items.map((child) => (
						<HeadingItem key={child.id} active={heading.active} pl={32} {...child} />
					))}
			</div>
		</>
	);
};

export const TableOfContents = () => {
	const { classes } = useStyles();

	// Find all h2, h3 elements on the page
	const params = useParams();
	const { nestedHeadings } = useHeadingsData(params?.['*'] ?? '');

	// Use intersection observer to find which heading is currently active
	const [activeId, setActiveId] = useState<string>(nestedHeadings[0]?.id ?? '');
	useIntersectionObserver(setActiveId, params?.['*'] ?? '');

	return (
		<nav className={classes.nav}>
			<Text fw={700}>On this page</Text>
			<div className={classes.wrapper}>
				{nestedHeadings.map((heading) => (
					<HeadingItem key={heading.id} active={activeId} {...heading} />
				))}
			</div>
		</nav>
	);
};
