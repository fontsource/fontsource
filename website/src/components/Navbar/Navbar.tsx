import { Flex, FlexProps, useDisclosure } from "@chakra-ui/react";

import { Logo } from "./Logo";
import { MenuLinks } from "./MenuLinks";
import { MenuToggle } from "./MenuToggle";

export const Navbar = (props: FlexProps) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <NavbarContainer {...props}>
      <Logo />
      <MenuToggle toggle={onToggle} isOpen={isOpen} />

      <MenuLinks isOpen={isOpen} />
    </NavbarContainer>
  );
};

const NavbarContainer = ({ children, ...props }) => {
  return (
    <Flex
      as="header"
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
