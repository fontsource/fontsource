import type { TextProps } from '@mantine/core';
import {
	Box,
	rem,
	Text,
	UnstyledButton,
	useMantineColorScheme,
} from '@mantine/core';
import { Link, useParams } from 'react-router';
import { useState } from 'react';

import { CarbonAd } from '@/components/CarbonAd';
import type { HeadingsData } from '@/hooks/useHeadingsData';
import { useHeadingsData } from '@/hooks/useHeadingsData';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

import classes from './TableOfContents.module.css';

interface HeadingItemProps extends HeadingsData, TextProps {
	active: string;
}

const HeadingItem = (heading: HeadingItemProps) => {
	const isActive = heading.active === heading.id;
	const { colorScheme } = useMantineColorScheme();

	return (
		<>
			<Box
				style={(theme) => ({
					borderLeft: isActive
						? `${rem(1)} solid ${theme.colors.purple[0]}`
						: colorScheme === 'dark'
							? `${rem(1)} solid ${theme.colors.border[1]}`
							: `${rem(1)} solid ${theme.colors.border[0]}`,
				})}
			>
				<UnstyledButton key={heading.id} component={Link} to={`#${heading.id}`}>
					<Text fz={15} fw={isActive ? 700 : 400} pl={heading.pl ?? 16} py={4}>
						{heading.title}
					</Text>
				</UnstyledButton>
			</Box>
			<div className={classes['nested-wrapper']}>
				{heading.items &&
					heading.items.length > 0 &&
					heading.items.map((child) => (
						<HeadingItem
							key={child.id}
							active={heading.active}
							pl={32}
							{...child}
						/>
					))}
			</div>
		</>
	);
};

export const TableOfContents = () => {
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
			<CarbonAd />
		</nav>
	);
};
