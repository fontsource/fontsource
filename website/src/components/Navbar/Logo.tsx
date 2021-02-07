import { Text } from "@chakra-ui/react";

import { NextChakraLink } from "../NextChakraLink";

export const Logo = () => {
  return (
    <NextChakraLink href="/">
      <Text fontWeight="700">Fontsource</Text>
    </NextChakraLink>
  );
};
