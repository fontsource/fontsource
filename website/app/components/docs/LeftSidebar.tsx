import sidebarConfigImport from '@docs/sidebar.json';
import {
	createStyles,
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

const useStyles = createStyles((theme) => ({
	wrapper: {
		position: 'sticky',
		top: rem(40),
		display: 'flex',
		flexDirection: 'column',
		width: rem(240),
		padding: `${rem(24)} 0`,
		border: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: rem(4),
	},

	routeItem: {
		display: 'flex',
		borderRadius: 0,
		padding: `${rem(10)} ${rem(24)}`,

		'&:hover': {
			color: theme.colors.purple[0],
			borderLeft: `${rem(1)} solid ${theme.colors.purple[0]}`,
		},
	},

	sections: {
		display: 'flex',
		flexDirection: 'column',
		padding: rem(24),
	},

	sectionItem: {
		alignItems: 'center',
		padding: `${rem(8)} ${rem(16)}`,
		marginBottom: rem(4),
		borderRadius: rem(4),

		'&:hover': {
			backgroundColor: 'rgba(98, 91, 248, 0.1)',
		},
	},
}));

interface RouteItemProps {
	slug: string;
	title: string;
	Icon: React.FC<IconProps>;
	active?: boolean;
}

const RouteItem = ({ slug, title, Icon, active }: RouteItemProps) => {
	const { classes } = useStyles();
	const { hovered, ref } = useHover<HTMLAnchorElement>();
	const theme = useMantineTheme();
	return (
		<UnstyledButton
			className={classes.routeItem}
			sx={{
				color: active ? theme.colors.purple[0] : 'inherit',
				borderLeft: active
					? `${rem(1)} solid ${theme.colors.purple[0]}`
					: `${rem(1)} solid transparent`,
			}}
			component={Link}
			to={`/docs/${slug}`}
			ref={ref}
		>
			<Group>
				<Icon
					height={18}
					stroke={active || hovered ? theme.colors.purple[0] : undefined}
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
}

const SectionItem = ({ slug, title, external, active }: SectionItemProps) => {
	const { classes } = useStyles();
	const theme = useMantineTheme();

	return (
		<UnstyledButton
			className={classes.sectionItem}
			sx={{
				backgroundColor: active ? 'rgba(98, 91, 248, 0.1)' : 'inherit',
			}}
			component={Link}
			to={external ? external : `/docs/${slug}`}
		>
			<Group position="apart">
				<Text
					fw={active ? 700 : 400}
					color={active ? theme.colors.purple[0] : 'inherit'}
				>
					{title}
				</Text>
				{external && <IconExternal />}
			</Group>
		</UnstyledButton>
	);
};

const LeftSidebar = () => {
	const { classes } = useStyles();
	const params = useParams();
	const route = params['*']?.split('/');
	const routeSection = route?.[0] as keyof SidebarConfig;
	const sectionSlug = route?.[1] as keyof SidebarConfig[typeof routeSection];

	return (
		<nav className={classes.wrapper}>
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
						<Text key={section} fw={700} fz={13} transform="uppercase" mb="sm">
							{section}
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
								/>
							)
						)}
					</Fragment>
				))}
			</Flex>
		</nav>
	);
};

export { LeftSidebar };
