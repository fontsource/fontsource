import type { ActionIconProps, ContainerProps } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Burger,
	Container,
	Divider,
	Group,
	ScrollArea,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import cx from 'clsx';
import { Link, NavLink, useLocation } from 'react-router';

import { LeftSidebar } from '@/components/docs/LeftSidebar';
import { IconDiscord, IconGithub } from '@/components/icons';
import { LogoText } from '@/components/logo/LogoText';

import classes from './Header.module.css';
import { ThemeButton, ThemeButtonMobile } from './ThemeButton';

interface IconProps extends ActionIconProps {
	label: string;
	icon: React.ReactNode;
	href: string;
}

const Icon = ({ label, icon, href, ...others }: IconProps) => {
	return (
		<Tooltip label={label}>
			<ActionIcon
				component="a"
				href={href}
				target="_blank"
				rel="noreferrer"
				variant="transparent"
				aria-label={label}
				{...others}
			>
				{icon}
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
	return (
		<Text>
			<NavLink
				to={to}
				prefetch="intent"
				className={({ isActive }) =>
					isActive ? cx(classes.link, classes.active) : classes.link
				}
				onClick={toggle}
			>
				{label}
			</NavLink>
		</Text>
	);
};

const MobileExternalIcon = ({ icon, label, href }: IconProps) => {
	return (
		<UnstyledButton
			component="a"
			className={classes.mobileLink}
			href={href}
			target="_blank"
			rel="noreferrer"
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
	const isDocs = useLocation().pathname.startsWith('/docs');

	return (
		<ScrollArea.Autosize mah="95vh" className={classes['mobile-links']}>
			<Stack>
				<Stack px={24}>
					<HeaderNavLink label="Fonts" to="/" toggle={toggle} />
					<HeaderNavLink label="Documentation" to="/docs" toggle={toggle} />
					<HeaderNavLink label="Tools" to="/tools" toggle={toggle} />
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
	);
};

export const Header = ({ ...other }: ContainerProps) => {
	const [opened, { toggle }] = useDisclosure(false);

	return (
		<>
			<Box component="header" className={classes.header}>
				<Container className={classes.inner} {...other}>
					<Link to="/" prefetch="intent" aria-label="Fontsource home">
						<LogoText height={31} isHeader />
					</Link>
					<Box className={classes.links} visibleFrom="sm">
						<Tooltip.Group openDelay={600} closeDelay={100}>
							<Group gap="md" justify="right">
								<HeaderNavLink label="Fonts" to="/" />
								<HeaderNavLink label="Documentation" to="/docs" />

								<HeaderNavLink label="Tools" to="/tools" />

								<ThemeButton />
								<Icon
									label="GitHub"
									href="https://github.com/fontsource/fontsource"
									icon={<IconGithub />}
								/>
								<Icon label="Discord" href="/discord" icon={<IconDiscord />} />
							</Group>
						</Tooltip.Group>
					</Box>
					<Burger
						opened={opened}
						onClick={toggle}
						hiddenFrom="sm"
						size="sm"
						aria-label={opened ? 'Close navigation' : 'Open navigation'}
					/>
				</Container>
			</Box>
			{opened && <MobileHeader toggle={toggle} />}
		</>
	);
};
