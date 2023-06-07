import { Global } from '@emotion/react';
import type { ActionIconProps, ContainerProps } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Burger,
	Container,
	createStyles,
	Divider,
	Group,
	rem,
	ScrollArea,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, NavLink, useLocation } from '@remix-run/react';

import { IconDiscord, IconGithub, LogoText, ThemeButton } from '@/components';

import { LeftSidebar } from '../docs/LeftSidebar';
import { ThemeButtonMobile } from './ThemeButton';

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

	mobileLinks: {
		height: '100vh',
		padding: `${rem(24)} ${rem(16)}`,
		alignContent: 'center',
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[5]
				: theme.colors.background[1],
	},

	link: {
		fontSize: theme.fontSizes.sm,
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		borderBottom: `${rem(2)} solid transparent`,
		transition: 'border-color 100ms ease, color 100ms ease',
		textDecoration: 'none',

		[theme.fn.largerThan('sm')]: {
			padding: `${rem(27)} ${theme.spacing.sm}`,

			'&:hover': {
				textDecoration: 'none',
				color: theme.colors.purple,
			},
		},
	},

	mobileLink: {
		display: 'flex',

		'&:hover': {
			color: theme.colors.purple[0],
		},
	},

	active: {
		fontWeight: 700,

		[theme.fn.largerThan('sm')]: {
			color: theme.colors.purple,
			borderBottomColor: theme.colors.purple,
		},
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
	toggle?: () => void;
}

const HeaderNavLink = ({ label, to, toggle }: HeaderNavLinkProps) => {
	const { classes, cx } = useStyles();

	const handleToggle = () => {
		// Wait to allow the browser to load new docs
		setTimeout(() => {
			toggle?.();
		}, 100);
	};

	return (
		<Text>
			<NavLink
				to={to}
				prefetch="intent"
				className={({ isActive }) =>
					cx(classes.link, isActive ? classes.active : undefined)
				}
				onClick={handleToggle}
			>
				{label}
			</NavLink>
		</Text>
	);
};

const MobileExternalIcon = ({ icon, label, href }: IconProps) => {
	const { classes } = useStyles();

	return (
		<UnstyledButton
			component="a"
			className={classes.mobileLink}
			href={href}
			target="_blank"
		>
			<Group>
				{icon}
				<Text>{label}</Text>
			</Group>
		</UnstyledButton>
	);
};

interface MobileHeaderProps {
	toggle: () => void;
}

const MobileHeader = ({ toggle }: MobileHeaderProps) => {
	const { classes } = useStyles();
	const isDocs = useLocation().pathname.startsWith('/docs');

	return (
		<>
			<Global styles={{ body: { overflow: 'hidden' } }} />
			<ScrollArea.Autosize mah="95vh" className={classes.mobileLinks}>
				<Stack>
					<Stack px={24}>
						<HeaderNavLink label="Fonts" to="/" toggle={toggle} />
						<HeaderNavLink label="Documentation" to="/docs" toggle={toggle} />
						<Divider />
						<ThemeButtonMobile />
						<MobileExternalIcon
							label="GitHub"
							href="https://github.com/fontsource/fontsource"
							icon={<IconGithub />}
						/>
						<MobileExternalIcon
							label="Discord"
							href="/discord"
							icon={<IconDiscord />}
						/>
					</Stack>
					{isDocs && (
						<>
							<Divider mx={24} />
							<LeftSidebar toggle={toggle} />
						</>
					)}
				</Stack>
			</ScrollArea.Autosize>
		</>
	);
};

export const Header = ({ ...other }: ContainerProps) => {
	const [opened, { toggle }] = useDisclosure(false);
	const { classes } = useStyles();

	return (
		<>
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
			{opened && <MobileHeader toggle={toggle} />}
		</>
	);
};
