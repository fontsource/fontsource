import { Box, Stack, StackProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

import docsList from "../configs/docsList.json";
import fontList from "../configs/fontList.json";
import { NextChakraLink } from "./NextChakraLink";

export const Sidebar = ({ ifDocs, ...rest }) => {
  if (ifDocs) {
    return (
      <SidebarContainer {...rest}>
        {docsList.map((page) => (
          <SidebarLinks key={page.key} path={page.path} title={page.title} />
        ))}
      </SidebarContainer>
    );
  }

  return (
    <SidebarContainer {...rest}>
      {fontList.map((page) => (
        <SidebarLinks key={page.key} path={page.path} title={page.title} />
      ))}
    </SidebarContainer>
  );
};

const SidebarLinks = ({ path, title }) => (
  <Box px={2}>
    <NextChakraLink
      href={path}
      prefetch={false}
      mr="auto"
      fontSize="sm"
      fontWeight="700"
      _focus={{ outline: 0 }}
    >
      {title}
    </NextChakraLink>
  </Box>
);

const SidebarContainer = (props: PropsWithChildren<StackProps>) => (
  <Stack
    as="aside"
    py={4}
    marginTop={4}
    height="80vh"
    overflowY="auto"
    sx={{ overscrollBehavior: "contain" }}
    {...props}
  />
);
