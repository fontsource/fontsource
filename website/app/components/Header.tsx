import { useState } from "react";
import { NavLink } from "@remix-run/react";
import {
  createStyles,
  Header as MantineHeader,
  Container,
  Text,
  Group,
  Burger,
  Image,
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

  mainLinks: {
    marginRight: -theme.spacing.sm,
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
  <Image src="./logo.svg" alt="Fontsource logo" height={31} fit="contain" />
);

const Icons = () => (
  <>
    <Image src="./icons/github.svg" alt="Discord" width={20} fit="contain" />
    <Image src="./icons/discord.svg" alt="Discord" width={20} fit="contain" />
  </>
);

export const Header = () => {
  const [opened, { toggle }] = useDisclosure(false);
  const { classes } = useStyles();

  return (
    <MantineHeader height={HEADER_HEIGHT} mb={120}>
      <Container className={classes.inner}>
        <Logo />
        <div className={classes.links}>
          <Group spacing={0} position="right" className={classes.mainLinks}>
            <Text className={classes.link}>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? classes.active : undefined
                }
              >
                Fonts
              </NavLink>
            </Text>
            <Text className={classes.link}>
              <NavLink
                to="/docs"
                className={({ isActive }) =>
                  isActive ? classes.active : undefined
                }
              >
                Documentation
              </NavLink>
            </Text>
            <ThemeButton />
            <Icons />
          </Group>
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
