import { NavLink } from "@remix-run/react";
import {
  createStyles,
  Header as MantineHeader,
  Container,
  Text,
  Group,
  Burger,
  Image,
  useMantineColorScheme,
  ActionIcon,
  Tooltip,
  ActionIconProps,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ThemeButton } from "@components";

const HEADER_HEIGHT = 72;

const useStyles = createStyles(theme => ({
  inner: {
    height: HEADER_HEIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  burger: {
    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  links: {
    paddingTop: theme.spacing.lg,
    height: HEADER_HEIGHT,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",

    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },

  link: {
    textTransform: "uppercase",
    fontSize: 13,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[1]
        : theme.colors.gray[6],
    padding: `7px ${theme.spacing.sm}px`,
    fontWeight: 700,
    borderBottom: "2px solid transparent",
    transition: "border-color 100ms ease, color 100ms ease",

    "&:hover": {
      color: theme.colorScheme === "dark" ? theme.white : theme.black,
      textDecoration: "none",
    },
  },

  active: {
    color: theme.colorScheme === "dark" ? theme.white : theme.black,
    borderBottomColor:
      theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 5 : 6],
  },
}));

const Logo = () => (
  <Image
    src="./logo.svg"
    alt="Fontsource logo"
    height={31}
    fit="contain"
    width="auto"
  />
);

interface IconProps extends ActionIconProps {
  label: string;
  src: string;
  href: string;
}

const Icon = ({ label, src, href, ...others }: IconProps) => {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="outline"
        color={dark ? "yellow" : "blue"}
        {...others}
      >
        <a href={href} target="_blank">
          <Image src={src} alt={label} width={20} fit="contain" />
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
  const { classes } = useStyles();

  return (
    <Text className={classes.link} {...others}>
      <NavLink
        to={to}
        className={({ isActive }) => (isActive ? classes.active : undefined)}
      >
        {label}
      </NavLink>
    </Text>
  );
};

export const Header = () => {
  const [opened, { toggle }] = useDisclosure(false);
  const { classes } = useStyles();

  return (
    <MantineHeader height={HEADER_HEIGHT} mb={120}>
      <Container className={classes.inner}>
        <Logo />
        <div className={classes.links}>
          <Tooltip.Group openDelay={600} closeDelay={100}>
            <Group spacing="xs" position="right">
              <HeaderNavLink label="Fonts" to="/" />
              <HeaderNavLink label="Documentation" to="/docs" />
              <ThemeButton />
              <Icon
                label="GitHub"
                src="./icons/github.svg"
                href="https://github.com/fontsource/fontsource"
              />
              <Icon
                label="Discord"
                src="./icons/discord.svg"
                href="https://discord.gg/UpHW6ZEyde"
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
    </MantineHeader>
  );
};
