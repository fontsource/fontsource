import type { ActionIconProps, ContainerProps } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Burger,
	Container,
	createStyles,
	Group,
	rem,
	Text,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, NavLink } from '@remix-run/react';

import { IconDiscord, IconGithub, LogoText, ThemeButton } from '@/components';

export const HEADER_HEIGHT = 72;

const useStyles = createStyles((theme) => ({
	header: {
		borderBottom: `${rem(1)} solid ${
			theme.colorScheme === 'dark' ? '#151E34' : '#EDF0F3'
		}`,
	},

	inner: {
		maxWidth: rem(1440),
		marginLeft: 'auto',
		marginRight: 'auto',
		height: rem(HEADER_HEIGHT),
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: `0 ${rem(64)}`,
	},

	burger: {
		[theme.fn.largerThan('sm')]: {
			display: 'none',
		},
	},

	links: {
		paddingTop: theme.spacing.lg,
		height: rem(HEADER_HEIGHT),
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',

		[theme.fn.smallerThan('sm')]: {
			display: 'none',
		},
	},

	link: {
		fontSize: theme.fontSizes.sm,
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		padding: `${rem(27)} ${theme.spacing.sm}`,
		borderBottom: `${rem(2)} solid transparent`,
		transition: 'border-color 100ms ease, color 100ms ease',
		textDecoration: 'none',

		'&:hover': {
			textDecoration: 'none',
			color: theme.colors.purple,
			borderBottomColor: theme.colors.purple,
			fontWeight: 700,
		},
	},

	active: {
		color: theme.colors.purple,
		borderBottomColor: theme.colors.purple,
		fontWeight: 700,
	},
}));

interface IconProps extends ActionIconProps {
	label: string;
	icon: React.ReactNode;
	href: string;
}

const Icon = ({ label, icon, href, ...others }: IconProps) => {
	return (
		<Tooltip label={label}>
			<ActionIcon variant="transparent" {...others}>
				<a href={href} target="_blank" rel="noreferrer">
					{icon}
				</a>
			</ActionIcon>
		</Tooltip>
	);
};

interface HeaderNavLinkProps {
	label: string;
	to: string;
}

const HeaderNavLink = ({ label, to }: HeaderNavLinkProps) => {
	const { classes, cx } = useStyles();

	return (
		<Text>
			<NavLink
				to={to}
				prefetch="intent"
				className={({ isActive }) =>
					cx(classes.link, isActive ? classes.active : undefined)
				}
			>
				{label}
			</NavLink>
		</Text>
	);
};

export const Header = ({ ...other }: ContainerProps) => {
	const [opened, { toggle }] = useDisclosure(false);
	const { classes } = useStyles();

	return (
		<Box component="header" className={classes.header}>
			<Container className={classes.inner} {...other}>
				<Link to="/">
					<LogoText height={31} isHeader />
				</Link>
				<div className={classes.links}>
					<Tooltip.Group openDelay={600} closeDelay={100}>
						<Group spacing="md" position="right">
							<HeaderNavLink label="Fonts" to="/" />
							<HeaderNavLink label="Documentation" to="/docs" />
							<ThemeButton />
							<Icon
								label="GitHub"
								href="https://github.com/fontsource/fontsource"
								icon={<IconGithub />}
							/>
							<Icon label="Discord" href="/discord" icon={<IconDiscord />} />
						</Group>
					</Tooltip.Group>
				</div>
				<Burger
					opened={opened}
					onClick={toggle}
					className={classes.burger}
					size="sm"
				/>
			</Container>
		</Box>
	);
};
