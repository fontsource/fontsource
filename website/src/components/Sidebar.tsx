import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonProps,
  Heading,
  Stack,
  StackProps,
} from "@chakra-ui/react";
import { useRouter } from "next/router";

import docsList from "../configs/docsList.json";
import fontList from "../configs/fontList.json";
import { NextChakraLink } from "./NextChakraLink";

interface SidebarButtonProps {
  key: string;
  title: string;
  path?: string;
  isParent?: boolean;
  isExternal?: boolean;
}

const SidebarButton = ({
  title,
  path,
  isParent,
  isExternal,
  ...props
}: SidebarButtonProps & ButtonProps) => {
  const { asPath } = useRouter();
  const isActive = (path: string) => path == asPath;

  if (isParent) {
    return (
      <Heading size="sm" pt={2} pb={4}>
        {title}
      </Heading>
    );
  }

  return (
    <Box>
      <NextChakraLink
        href={path}
        prefetch={false}
        isExternal={isExternal}
        fontWeight="700"
        _hover={{ textDecoration: "none" }}
      >
        <Button
          size="sm"
          width="98%"
          variant="ghost"
          colorScheme="gray"
          justifyContent="left"
          rightIcon={isExternal && <ExternalLinkIcon />}
          isActive={isActive(path)}
          _focus={{
            boxShadow: "none",
          }}
          {...props}
        >
          {title}
        </Button>
      </NextChakraLink>
    </Box>
  );
};

const SidebarContainer = (props: StackProps) => (
  <Stack
    as="aside"
    py={4}
    direction="column"
    marginTop={4}
    height="80vh"
    overflowY="auto"
    sx={{ overscrollBehavior: "contain" }}
    {...props}
  />
);

export const Sidebar = ({ ifDocs, ...rest }) => {
  return (
    <SidebarContainer {...rest}>
      <Heading size="sm" pb={4}>
        Contents
      </Heading>
      {ifDocs
        ? docsList.map((page) => (
            <SidebarButton key={page.key} my={0.5} {...page} />
          ))
        : fontList.map((page) => (
            <SidebarButton
              key={page.key}
              isParent={false}
              isExternal={false}
              {...page}
            />
          ))}
    </SidebarContainer>
  );
};
