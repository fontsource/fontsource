import {
  Box,
  Flex,
  FlexProps,
  Stack,
  StackProps,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactNode } from "react";

import { NextChakraLink } from "../NextChakraLink";
import { DarkModeSwitch } from "./DarkModeSwitch";
import { MobileNavButton, MobileNavContent } from "./MobileNav";

export const Logo = () => {
  return (
    <NextChakraLink href="/">
      <Text fontWeight="700">Fontsource</Text>
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

export const MenuItem = ({ children, to = "/", ...rest }: MenuItemProps) => {
  return (
    <NextChakraLink href={to}>
      <Text display="block" {...rest}>
        {children}
      </Text>
    </NextChakraLink>
  );
};

export const MenuStack = (props: StackProps) => (
  <Stack spacing={8} align="center" justify="flex-end" {...props}>
    <MenuItem to="/">Home</MenuItem>
    <MenuItem to="/docs/introduction">Documentation</MenuItem>
    <MenuItem to="/fonts">Font Previews</MenuItem>
    <DarkModeSwitch />
  </Stack>
);

export const Navbar = (props: FlexProps) => {
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
      <MobileNavContent isOpen={isOpen} onToggle={onToggle} />
    </>
  );
};
