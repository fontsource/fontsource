import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Button, Heading, Stack, StackProps } from "@chakra-ui/react";
import { useRouter } from "next/router";

import docsList from "../configs/docsList.json";
import fontList from "../configs/fontList.json";
import { NextChakraLink } from "./NextChakraLink";

interface DocProps {
  key: string;
  title: string;
  path?: string;
  isParent?: boolean;
  isExternal?: boolean;
  isActive?: boolean;
}

const DocSidebarLinks = ({
  title,
  path,
  isParent,
  isExternal,
  isActive,
}: DocProps) => {
  if (isParent) {
    return (
      <Heading size="sm" pt={2} pb={4}>
        {title}
      </Heading>
    );
  }

  return (
    <NextChakraLink
      href={path}
      prefetch={false}
      isExternal={isExternal}
      fontWeight="700"
      _hover={{ textDecoration: "none" }}
    >
      <Button
        size="sm"
        width="100%"
        variant="ghost"
        colorScheme="gray"
        my={0.5}
        justifyContent="left"
        rightIcon={isExternal && <ExternalLinkIcon />}
        isActive={isActive}
        _focus={{
          boxShadow: "none",
        }}
      >
        {title}
      </Button>
    </NextChakraLink>
  );
};

interface FontProps {
  key: string;
  title: string;
  path: string;
}

const FontSidebarLinks = ({ path, title }: FontProps) => (
  <Box px={2}>
    <NextChakraLink
      href={path}
      prefetch={false}
      fontSize="sm"
      fontWeight="700"
      _focus={{ outline: 0 }}
    >
      {title}
    </NextChakraLink>
  </Box>
);

const SidebarContainer = (props: StackProps) => (
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

export const Sidebar = ({ ifDocs, ...rest }) => {
  const { asPath } = useRouter();

  const isActive = (path: string) => path == asPath;

  return (
    <SidebarContainer {...rest}>
      <Heading size="sm" pb={4}>
        Contents
      </Heading>
      {ifDocs
        ? docsList.map((page) => (
            <DocSidebarLinks
              key={page.key}
              isActive={isActive(page.path)}
              {...page}
            />
          ))
        : fontList.map((page) => <FontSidebarLinks key={page.key} {...page} />)}
    </SidebarContainer>
  );
};
