import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonProps,
  Divider,
  Heading,
  Stack,
  StackProps,
  useColorModeValue,
} from "@chakra-ui/react";
import { useRouter } from "next/router";

import docsList from "../configs/docsList.json";
import fontList from "../configs/fontList.json";
import { NextChakraLink } from "./NextChakraLink";

const SidebarHeading = ({ title, ...props }) => {
  const headingColor = useColorModeValue("gray.600", "gray.200");
  return (
    <>
      <Heading
        size="sm"
        pt={{ base: 6, md: 4 }}
        textAlign={{ base: "center", md: "inherit" }}
        textTransform="uppercase"
        fontWeight="800"
        color={headingColor}
        letterSpacing={{ base: "1px", md: "0.5px" }}
        {...props}
      >
        {title}
      </Heading>
      <Divider />
    </>
  );
};

interface SidebarButtonProps {
  key: string;
  title: string;
  path?: string;
  isParent?: boolean;
  isExternal?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

const SidebarButton = ({
  title,
  path,
  isParent,
  isExternal,
  isOpen,
  onToggle,
  ...props
}: SidebarButtonProps & ButtonProps) => {
  const { asPath } = useRouter();
  const isActive = (path: string) => path == asPath;

  if (isParent) {
    return <SidebarHeading title={title} />;
  }

  return (
    <Box align="center">
      <NextChakraLink
        href={path}
        prefetch={false}
        isExternal={isExternal}
        fontWeight="700"
        _hover={{ textDecoration: "none" }}
      >
        <Button
          size="sm"
          width={{
            base: "50%",
            md: "98%",
          }}
          variant="ghost"
          colorScheme="gray"
          justifyContent={{ base: "center", md: "left" }}
          rightIcon={isExternal && <ExternalLinkIcon />}
          isActive={isActive(path)}
          _focus={{
            boxShadow: "none",
          }}
          onClick={isOpen && onToggle}
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

interface SidebarProps extends StackProps {
  ifDocs: boolean;
  onToggle?: () => void;
  isOpen?: boolean;
}

export const Sidebar = ({
  ifDocs,
  onToggle,
  isOpen,
  ...rest
}: SidebarProps) => {
  return (
    <SidebarContainer {...rest}>
      <SidebarHeading title={"Contents"} pt={{ base: 6, md: 2 }} />
      {ifDocs
        ? docsList.map((page) => (
            <SidebarButton
              key={page.key}
              my={0.5}
              isOpen={isOpen}
              onToggle={onToggle}
              {...page}
            />
          ))
        : fontList.map((page) => (
            <SidebarButton
              key={page.key}
              isParent={false}
              isExternal={false}
              isOpen={isOpen}
              onToggle={onToggle}
              {...page}
            />
          ))}
    </SidebarContainer>
  );
};
