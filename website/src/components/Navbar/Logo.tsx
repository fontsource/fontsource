import { Box, BoxProps, useColorModeValue } from "@chakra-ui/react";
import Image from "next/image";

import { NextChakraLink } from "../NextChakraLink";

export const Logo = (props: BoxProps) => {
  const logoURL = useColorModeValue("/lotus-logo-d.svg", "/lotus-logo-w.svg");

  return (
    <NextChakraLink href="/">
      <Box boxSize="65px" position="relative" {...props}>
        <Image
          src={logoURL}
          alt="Logo"
          layout="fill"
          objectFit="contain"
          priority={true}
        />
      </Box>
    </NextChakraLink>
  );
};
