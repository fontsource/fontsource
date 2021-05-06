import {
  Box,
  Button,
  ButtonProps,
  Flex,
  HStack,
  IconButton,
  Link,
  Stack,
  StackProps,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { AiFillGithub } from "react-icons/ai";

import { NextChakraLink } from "../NextChakraLink";
import { DarkModeSwitch } from "./DarkModeSwitch";
import { MobileNavButton, MobileNavContent } from "./MobileNav";

export const Logo = () => {
  return (
    <NextChakraLink href="/">
      <Button size="md" width="100%" variant="ghost" colorScheme="gray">
        Fontsource
      </Button>
    </NextChakraLink>
  );
};

interface NavbarContainerProps {
  children: ReactNode;
}

const NavbarContainer = ({ children, ...props }: NavbarContainerProps) => {
  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      w="100%"
      p={8}
      {...props}
    >
      {children}
    </Flex>
  );
};

interface MenuItemProps {
  children: ReactNode;
  to: string;
}

export const MenuItem = ({
  children,
  to = "/",
  ...props
}: MenuItemProps & ButtonProps) => {
  return (
    <NextChakraLink href={to}>
      <Button
        size="md"
        width="100%"
        variant="ghost"
        colorScheme="gray"
        {...props}
      >
        {children}
      </Button>
    </NextChakraLink>
  );
};

export const MenuStack = (props: StackProps) => (
  <Stack
    spacing={{ base: 0, md: 4 }}
    align="center"
    justify="flex-end"
    {...props}
  >
    <MenuItem display={{ base: "none", md: "block" }} to="/">
      Home
    </MenuItem>
    <HStack pb={{ base: 4, md: 0 }}>
      <MenuItem to="/docs/introduction">Documentation</MenuItem>
      <MenuItem to="/fonts">Font Previews</MenuItem>
    </HStack>
    <HStack>
      <DarkModeSwitch />
      <Link href="https://github.com/fontsource/fontsource" isExternal>
        <IconButton
          aria-label="Link to GitHub"
          variant="ghost"
          fontSize="xl"
          icon={<AiFillGithub />}
        />
      </Link>
    </HStack>
  </Stack>
);

interface NavbarProps {
  ifDocs: boolean;
}

export const Navbar = ({ ifDocs, ...props }: NavbarProps) => {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <>
      <NavbarContainer {...props}>
        <Logo />
        <Box
          display={{ base: "none", md: "block" }}
          flexBasis={{ base: "100%", md: "auto" }}
        >
          <MenuStack direction="row" />
        </Box>
        <MobileNavButton
          aria-label="Navigation"
          onToggle={onToggle}
          isOpen={isOpen}
        />
      </NavbarContainer>
      <MobileNavContent isOpen={isOpen} onToggle={onToggle} ifDocs={ifDocs} />
    </>
  );
};
