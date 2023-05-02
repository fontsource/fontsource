import {
	Button,
	createStyles,
	Divider,
	Flex,
	Group,
	rem,
	ScrollArea,
	Text,
	UnstyledButton,
	useMantineTheme,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { Link, useParams } from '@remix-run/react';
import { useAtom } from 'jotai';

import type { IconProps } from '@/components/icons';
import {
	IconChangelog,
	IconGeneral,
	IconGuide,
	IconTool,
} from '@/components/icons';

import { sidebarAtom } from './atoms';

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
		borderRadius: 0,
		padding: `${rem(10)} ${rem(24)}`,
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

				'&:hover': {
					color: theme.colors.purple[0],
					borderLeft: `${rem(1)} solid ${theme.colors.purple[0]}`,
				},
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
}

const SectionItem = ({ slug, title }: SectionItemProps) => {
	const { classes } = useStyles();
	const theme = useMantineTheme();

	return (
		<Button className={classes.routeItem} variant='subtle' component={Link} to={`/docs/${slug}`}>
			<Text fw={700} color={theme.colors.purple[0]}>
				{title}
			</Text>
		</Button>
	);
};


const LeftSidebar = () => {
	const { classes } = useStyles();
	const params = useParams();
	const route = params['*']?.split('/');
	const [content] = useAtom(sidebarAtom);

	return (
		<ScrollArea.Autosize mah="100vh">
			<Flex className={classes.wrapper}>
				{Object.entries(sections).map(([slug, { title, icon }]) => (
					<RouteItem
						key={slug}
						slug={slug}
						title={title}
						Icon={icon}
						active={route?.[0] === slug}
					/>
				))}
				<Divider />
				{Object.keys(content).map((section) => (
					<>
						<Text key={section}>{section}</Text>
						{Object.entries(content[section]).map(([slug, title]) => (
							<SectionItem key={slug} slug={slug} title={title} />
						))}
					</>
				))}
			</Flex>
		</ScrollArea.Autosize>
	);
};

export { LeftSidebar };
