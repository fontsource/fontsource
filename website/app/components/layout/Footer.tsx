import type { ActionIconProps, ContainerProps } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Container,
	Group,
	Text,
	Tooltip,
} from '@mantine/core';
import { Link } from '@remix-run/react';

import { IconDiscord, IconGithub } from '@/components/icons';
import { LogoText } from '@/components/logo/LogoText';

import classes from './Footer.module.css';
import { ThemeButton } from './ThemeButton';

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
	return (
		<Text>
			<Link to={to} className={classes.link}>
				{label}
			</Link>
		</Text>
	);
};

export const Footer = ({ ...other }: ContainerProps) => {
	// TODO: Sponsors
	// <FooterNavLink label="Sponsors" to="/sponsors" />

	return (
		// @ts-expect-error - Mantine v7 typing errors
		<Box component="footer" className={classes.header} {...other}>
			<Container className={classes.inner}>
				<Link to="/">
					<LogoText height={31} />
				</Link>
				<div className={classes.links}>
					<Tooltip.Group openDelay={600} closeDelay={100}>
						<Group gap="md" justify="right">
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
