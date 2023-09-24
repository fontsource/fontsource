import sidebarConfigImport from '@docs/sidebar.json';
import {
	Box,
	Divider,
	Flex,
	Group,
	rem,
	Text,
	UnstyledButton,
	useMantineTheme,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { Link, useParams } from '@remix-run/react';
import { Fragment } from 'react';

import type { IconProps } from '@/components/icons';
import {
	IconChangelog,
	IconExternal,
	IconGeneral,
	IconGuide,
	IconTool,
} from '@/components/icons';

import classes from './docs.module.css';

interface SidebarConfig {
	[slug: string]: {
		[section: string]: {
			[slug: string]:
				| string
				| {
						// title
						name: string;
						external: string; // url
				  };
		};
	};
}
const sidebarConfig = sidebarConfigImport as SidebarConfig;

interface SectionsData {
	[slug: string]: {
		title: string;
		icon: React.FC<IconProps>;
	};
}

const sections: SectionsData = {
	'getting-started': {
		title: 'Getting Started',
		icon: IconGeneral,
	},
	guides: {
		title: 'Guides',
		icon: IconGuide,
	},
	api: {
		title: 'API',
		icon: IconTool,
	},
	changelog: {
		title: 'Changelog',
		icon: IconChangelog,
	},
};

interface RouteItemProps {
	slug: string;
	title: string;
	Icon: React.FC<IconProps>;
	active?: boolean;
}

const RouteItem = ({ slug, title, Icon, active }: RouteItemProps) => {
	const { hovered, ref } = useHover<HTMLAnchorElement>();
	const theme = useMantineTheme();
	return (
		<UnstyledButton
			className={classes['route-item']}
			style={(theme) => ({
				color: active ? theme.colors.purple[0] : 'inherit',
				'@media (min-width: $mantine-breakpoint-sm)': {
					borderLeft: active
						? `${rem(1)} solid ${theme.colors.purple[0]}`
						: undefined,
				},
			})}
			component={Link}
			to={
				slug === 'changelog'
					? 'https://github.com/fontsource/fontsource/blob/main/CHANGELOG.md'
					: `/docs/${slug}`
			}
			ref={ref}
			target={slug === 'changelog' ? '_blank' : undefined}
		>
			<Group>
				<Icon
					height={18}
					stroke={active ?? hovered ? theme.colors.purple[0] : undefined}
				/>
				<Text fw={active ? 700 : 400}>{title}</Text>
			</Group>
		</UnstyledButton>
	);
};

interface SectionItemProps {
	slug: string;
	title: string;
	external?: string;
	active?: boolean;
	toggle?: () => void;
}

const SectionItem = ({
	slug,
	title,
	external,
	active,
	toggle,
}: SectionItemProps) => {
	const theme = useMantineTheme();

	const handleToggle = () => {
		// Wait to allow the browser to load new docs
		setTimeout(() => {
			toggle?.();
		}, 100);
	};

	return (
		<UnstyledButton
			className={classes['section-item']}
			style={{
				backgroundColor: active ? theme.colors.purple[0] : 'inherit',
			}}
			component={Link}
			to={external ?? `/docs/${slug}`}
			onClick={handleToggle}
		>
			<Group justify="apart">
				<Text
					fw={active ? 700 : 400}
					c={active ? theme.colors.purple[0] : 'inherit'}
				>
					{title}
				</Text>
				{external && <IconExternal />}
			</Group>
		</UnstyledButton>
	);
};

interface LeftSidebarProps {
	toggle?: () => void;
}

const LeftSidebar = ({ toggle }: LeftSidebarProps) => {
	const params = useParams();
	const route = params['*']?.split('/');
	const routeSection = route?.[0] as keyof SidebarConfig;
	const sectionSlug = route?.[1] as keyof SidebarConfig[typeof routeSection];

	return (
		<>
			<Box component="nav" className={classes.wrapper}>
				{Object.entries(sections).map(([slug, { title, icon }]) => (
					<RouteItem
						key={slug}
						slug={slug}
						title={title}
						Icon={icon}
						active={route?.[0] === slug}
					/>
				))}
				<Flex className={classes.sections}>
					{Object.keys(sidebarConfig[routeSection]).map((section) => (
						<Fragment key={section}>
							<Text key={section} fw={700} fz={13} mt="sm" mb="sm">
								{section.toUpperCase()}
							</Text>
							<Divider mb="xs" />
							{Object.entries(sidebarConfig[routeSection][section]).map(
								([slug, item]) => (
									<SectionItem
										key={slug}
										slug={`${routeSection}/${slug}`}
										title={typeof item === 'string' ? item : item.name}
										external={
											typeof item === 'string' ? undefined : item.external
										}
										active={sectionSlug === slug}
										toggle={toggle}
									/>
								),
							)}
						</Fragment>
					))}
				</Flex>
			</Box>
		</>
	);
};

export { LeftSidebar };
