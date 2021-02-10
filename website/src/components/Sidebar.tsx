import { Flex } from "@chakra-ui/react";

import docsList from "../configs/docsList.json";
import fontList from "../configs/fontList.json";
import { NextChakraLink } from "./NextChakraLink";

export const Sidebar = ({ ifDocs, ...rest }) => {
  if (ifDocs) {
    return (
      <Flex as="aside" direction="column" py={4} {...rest}>
        {docsList.map((page) => (
          <NextChakraLink
            prefetch={false}
            display="flex"
            key={page.key}
            href={page.path}
          >
            {page.title}
          </NextChakraLink>
        ))}
      </Flex>
    );
  }

  return (
    <Flex as="aside" direction="column" py={4} {...rest}>
      {fontList.map((page) => (
        <NextChakraLink
          prefetch={false}
          display="flex"
          key={page.key}
          href={page.path}
        >
          {page.title}
        </NextChakraLink>
      ))}
    </Flex>
  );
};
