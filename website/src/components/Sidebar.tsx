import { Flex, FlexProps, Text } from "@chakra-ui/react";

import docsList from "../../docs/docsList.json";
import { NextChakraLink } from "./NextChakraLink";

export const Sidebar = (props: FlexProps) => (
  <Flex as="aside" direction="column" py={4} {...props}>
    {docsList.map((page) => (
      <NextChakraLink display="flex" key={page.key} href={page.path}>
        {page.title}
      </NextChakraLink>
    ))}
  </Flex>
);
