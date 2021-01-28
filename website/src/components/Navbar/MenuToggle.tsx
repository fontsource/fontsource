import { Box, CloseButton, IconButton } from "@chakra-ui/react";
import { FiMenu as MenuIcon } from "react-icons/fi";

export const MenuToggle = ({ toggle, isOpen }) => {
  return (
    <Box display={{ base: "inline-block", md: "none" }} onClick={toggle}>
      {isOpen ? (
        <IconButton aria-label="Close menu" icon={<CloseButton />} />
      ) : (
        <IconButton aria-label="Open menu" icon={<MenuIcon />} />
      )}
    </Box>
  );
};
