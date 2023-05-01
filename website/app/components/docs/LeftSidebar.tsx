import {
	createStyles,
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

import type { IconProps } from '@/components/icons';
import {
	IconChangelog,
	IconGeneral,
	IconGuide,
	IconTool,
} from '@/components/icons';

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

	sectionItem: {
		borderRadius: 0,
		padding: `${rem(10)} ${rem(24)}`,
	},
}));

interface SectionItemProps {
	slug: string;
	title: string;
	Icon: React.FC<IconProps>;
	active?: boolean;
}

const SectionItem = ({ slug, title, Icon, active }: SectionItemProps) => {
	const { classes } = useStyles();
	const { hovered, ref } = useHover<HTMLAnchorElement>();
	const theme = useMantineTheme();
	return (
		<UnstyledButton
			className={classes.sectionItem}
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

const LeftSidebar = () => {
	const { classes } = useStyles();
	const params = useParams();
	const route = params['*']?.split('/');

	return (
		<ScrollArea.Autosize mah="100vh">
			<Flex className={classes.wrapper}>
				{Object.entries(sections).map(([slug, { title, icon }]) => (
					<SectionItem
						key={slug}
						slug={slug}
						title={title}
						Icon={icon}
						active={route?.[0] === slug}
					/>
				))}
			</Flex>
		</ScrollArea.Autosize>
	);
};

export { LeftSidebar };
