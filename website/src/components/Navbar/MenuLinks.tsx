import { Box, Button, Stack, Text } from "@chakra-ui/react";

import { NextChakraLink } from "../NextChakraLink";
import { DarkModeSwitch } from "./DarkModeSwitch";

const MenuItem = ({ children, to = "/", ...rest }) => {
  return (
    <NextChakraLink href={to}>
      <Text display="block" {...rest}>
        {children}
      </Text>
    </NextChakraLink>
  );
};

export const MenuLinks = ({ isOpen }) => {
  return (
    <Box
      display={{ base: isOpen ? "block" : "none", md: "block" }}
      flexBasis={{ base: "100%", md: "auto" }}
    >
      <Stack
        spacing={8}
        align="center"
        justify={["center", "space-between", "flex-end", "flex-end"]}
        direction={["column", "row", "row", "row"]}
        pt={[4, 4, 0, 0]}
      >
        <MenuItem to="/">Home</MenuItem>
        <MenuItem to="/docs/getting-started">Documentation</MenuItem>
        <MenuItem to="/fonts">Font Previews</MenuItem>
        <DarkModeSwitch />
      </Stack>
    </Box>
  );
};
