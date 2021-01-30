import { Flex, FlexProps, Text } from "@chakra-ui/react";

import docsList from "../../docs/docsList.json";
import { NextChakraLink } from "./NextChakraLink";

export const Sidebar = (props: FlexProps) => (
  <Flex
    as="aside"
    direction="column"
    alignItems="center"
    justifyContent="flex-start"
    py={4}
    borderRightWidth="1px"
    width="30vw"
    {...props}
  >
    {docsList.map((page) => (
      <NextChakraLink key={page.key} href={page.path}>
        <Text>{page.title}</Text>
      </NextChakraLink>
    ))}
  </Flex>
);
