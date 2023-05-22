import type { ActionIconProps, ContainerProps } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Container,
	createStyles,
	Group,
	rem,
	Text,
	Tooltip,
} from '@mantine/core';
import { Link } from '@remix-run/react';

import { IconDiscord, IconGithub, LogoText, ThemeButton } from '@/components';

export const FOOTER_HEIGHT = 72;

const useStyles = createStyles((theme) => ({
	header: {
		backgroundColor: theme.colors.text[1],
	},

	inner: {
		maxWidth: rem(1440),
		marginLeft: 'auto',
		marginRight: 'auto',
		height: rem(FOOTER_HEIGHT),
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: `0 ${rem(64)}`,
	},

	links: {
		paddingTop: theme.spacing.lg,
		height: rem(FOOTER_HEIGHT),
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',

		[theme.fn.smallerThan('sm')]: {
			display: 'none',
		},
	},

	link: {
		fontSize: theme.fontSizes.sm,
		color: theme.colors.text[0],
		padding: `${rem(27)} ${theme.spacing.sm}`,
		textDecoration: 'none',

		'&:hover': {
			textDecoration: 'underline',
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

interface FooterNavLinkProps {
	label: string;
	to: string;
}

const FooterNavLink = ({ label, to }: FooterNavLinkProps) => {
	const { classes } = useStyles();
	return (
		<Text>
			<Link to={to} className={classes.link}>
				{label}
			</Link>
		</Text>
	);
};

export const Footer = ({ ...other }: ContainerProps) => {
	const { classes } = useStyles();

	// TODO: Sponsors
	// <FooterNavLink label="Sponsors" to="/sponsors" />

	return (
		<Box component="footer" className={classes.header} {...other}>
			<Container className={classes.inner}>
				<Link to="/">
					<LogoText height={31} />
				</Link>
				<div className={classes.links}>
					<Tooltip.Group openDelay={600} closeDelay={100}>
						<Group spacing="md" position="right">
							<FooterNavLink label="Fonts" to="/" />
							<FooterNavLink label="Documentation" to="/docs" />

							<ThemeButton stroke="white" />
							<Icon
								label="GitHub"
								href="https://github.com/fontsource/fontsource"
								icon={<IconGithub stroke="white" />}
							/>
							<Icon
								label="Discord"
								href="/discord"
								icon={<IconDiscord stroke="white" />}
							/>
						</Group>
					</Tooltip.Group>
				</div>
			</Container>
		</Box>
	);
};
