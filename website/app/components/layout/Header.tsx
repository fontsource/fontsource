import { useValue } from '@legendapp/state/react';
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
import { IconStack2 } from '@tabler/icons-react';
import cx from 'clsx';
import { Form, Link, NavLink, useLocation } from 'react-router';

import { LeftSidebar } from '@/components/docs/LeftSidebar';
import { IconDiscord, IconGithub, IconSearch } from '@/components/icons';
import { LogoText } from '@/components/logo/LogoText';
import { useCurrentProjectStore } from '@/features/projects/CurrentProjectProvider';

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

const SelectedFontsLink = ({
	count,
	ready,
}: {
	count: number;
	ready: boolean;
}) => {
	const label =
		ready && count > 0
			? `Font set, ${count} ${count === 1 ? 'font' : 'fonts'}`
			: 'Font set';

	return (
		<Tooltip label="Font set">
			<NavLink
				to="/selected-fonts"
				aria-label={label}
				className={({ isActive }) =>
					isActive
						? cx(classes.selectedFonts, classes.selectedFontsActive)
						: classes.selectedFonts
				}
			>
				<IconStack2 aria-hidden size={20} stroke={1.8} />
				{ready && count > 0 && (
					<span className={classes.selectedCount} aria-hidden>
						{count > 99 ? '99+' : count}
					</span>
				)}
			</NavLink>
		</Tooltip>
	);
};

const MobileExternalIcon = ({ icon, label, href }: IconProps) => {
	return (
		<UnstyledButton
			component="a"
			className={classes['mobile-link']}
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
	selectedLabel: string;
}

const MobileHeader = ({ toggle, selectedLabel }: MobileHeaderProps) => {
	const isDocs = useLocation().pathname.startsWith('/docs');

	return (
		<ScrollArea.Autosize mah="95vh" className={classes['mobile-links']}>
			<Stack>
				<Stack px={24}>
					<HeaderNavLink label="Fonts" to="/" toggle={toggle} />
					<HeaderNavLink label="Documentation" to="/docs" toggle={toggle} />
					<HeaderNavLink label="Tools" to="/tools" toggle={toggle} />
					<HeaderNavLink
						label={selectedLabel}
						to="/selected-fonts"
						toggle={toggle}
					/>
					<HeaderNavLink label="Privacy Policy" to="/privacy" toggle={toggle} />
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
	const projectStore = useCurrentProjectStore();
	const projectReady = useValue(projectStore.ready$);
	const projectCount = useValue(() => projectStore.getItems().length);
	const selectedLabel =
		projectReady && projectCount > 0
			? `Font set (${projectCount})`
			: 'Font set';
	const isFontPage = useLocation().pathname.startsWith('/fonts/');

	return (
		<>
			<Box component="header" className={classes.header}>
				<Container className={classes.inner} {...other}>
					<Link to="/" prefetch="intent" aria-label="Fontsource home">
						<LogoText height={31} isHeader />
					</Link>
					{isFontPage && (
						<>
							<search className={classes.fontSearch}>
								<Form action="/">
									<button
										type="submit"
										className={classes.searchSubmit}
										aria-label="Search fonts"
									>
										<IconSearch aria-hidden height={17} />
									</button>
									<input
										type="search"
										name="query"
										aria-label="Search fonts"
										placeholder="Search fonts"
									/>
								</Form>
							</search>
							<Tooltip label="Search fonts">
								<Link
									to="/"
									className={classes.fontSearchShortcut}
									aria-label="Search fonts"
								>
									<IconSearch aria-hidden height={18} />
								</Link>
							</Tooltip>
						</>
					)}
					<Box className={classes.links} visibleFrom="sm">
						<Tooltip.Group openDelay={600} closeDelay={100}>
							<Group gap="md" justify="right">
								<HeaderNavLink label="Fonts" to="/" />
								<HeaderNavLink label="Documentation" to="/docs" />

								<HeaderNavLink label="Tools" to="/tools" />
								<SelectedFontsLink count={projectCount} ready={projectReady} />

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
					<Group gap="sm" hiddenFrom="sm">
						<SelectedFontsLink count={projectCount} ready={projectReady} />
						<Burger
							className={classes.burger}
							opened={opened}
							onClick={toggle}
							size="sm"
							aria-label={opened ? 'Close navigation' : 'Open navigation'}
						/>
					</Group>
				</Container>
			</Box>
			{opened && <MobileHeader toggle={toggle} selectedLabel={selectedLabel} />}
		</>
	);
};
