import { IconDiscord, IconGithub, LogoText, ThemeButton } from '@components';
import type { ActionIconProps, ContainerProps } from '@mantine/core';
import {
  ActionIcon,
  Anchor,
  Box,
  Burger,
  Container,
  createStyles,
  Group,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, NavLink } from '@remix-run/react';

const HEADER_HEIGHT = 72;

const useStyles = createStyles(theme => ({
  header: {
    borderBottom: `1px solid ${
      theme.colorScheme === 'dark' ? '#151E34' : '#EDF0F3'
    }`,
  },

  inner: {
    maxWidth: '1440px',
    marginLeft: 'auto',
    marginRight: 'auto',
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0px 64px',
  },

  burger: {
    [theme.fn.largerThan('sm')]: {
      display: 'none',
    },
  },

  links: {
    paddingTop: theme.spacing.lg,
    height: HEADER_HEIGHT,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },

  link: {
    fontSize: 15,
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.text[0]
        : theme.colors.text[1],
    padding: `27px ${theme.spacing.sm}px`,
    borderBottom: '2px solid transparent',
    transition: 'border-color 100ms ease, color 100ms ease',
    textDecoration: 'none',

    '&:hover': {
      textDecoration: 'none',
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
      <ActionIcon variant="subtle" {...others}>
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

const HeaderNavLink = ({ label, to, ...others }: HeaderNavLinkProps) => {
  const { classes, cx } = useStyles();

  return (
    <Anchor component="text" {...others}>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cx(classes.link, isActive ? classes.active : undefined)
        }
      >
        {label}
      </NavLink>
    </Anchor>
  );
};

export const Header = ({ ...other }: ContainerProps) => {
  const [opened, { toggle }] = useDisclosure(false);
  const { classes } = useStyles();

  return (
    <Box component="header" className={classes.header}>
      <Container className={classes.inner} {...other}>
        <Link to="/">
          <LogoText height={31} />
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
              <Icon
                label="Discord"
                href="https://discord.gg/UpHW6ZEyde"
                icon={<IconDiscord />}
              />
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
