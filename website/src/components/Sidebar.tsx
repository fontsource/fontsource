import { Flex, FlexProps } from "@chakra-ui/react";
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

const SidebarLinks = ({ key, path, title }) => (
  <NextChakraLink
    key={key}
    href={path}
    prefetch={false}
    passHref
    display="flex"
    my={2}
    fontSize="sm"
    fontWeight="600"
  >
    {title}
  </NextChakraLink>
);

const SidebarContainer = (props: PropsWithChildren<FlexProps>) => (
  <Flex
    as="aside"
    direction="column"
    py={4}
    marginTop={4}
    height="80vh"
    overflowY="auto"
    sx={{ overscrollBehavior: "contain" }}
    {...props}
  />
);
