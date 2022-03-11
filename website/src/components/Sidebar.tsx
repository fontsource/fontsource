import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonProps,
  chakra,
  Divider,
  forwardRef,
  Heading,
  Stack,
  StackProps,
  useColorModeValue,
  useMediaQuery,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useRef } from "react";
import StickyBox from "react-sticky-box";

import docsList from "../configs/docsList.json";
import fontList from "../configs/fontList.json";
import { usePersistedScrollTop } from "../hooks/usePersistedScrollTop";
import { NextChakraLink } from "./NextChakraLink";

// https://github.com/codecks-io/react-sticky-box/issues/74
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const StickyChakra = chakra(StickyBox);

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

const SidebarContainer = forwardRef<StackProps, "div">(
  (props: StackProps, ref) => (
    <StickyChakra overflowY="hidden">
      <Stack
        ref={ref}
        as="aside"
        overscrollBehavior="contain"
        py={4}
        direction="column"
        marginTop={4}
        height={{ base: "100%", md: "85vh" }}
        overflowY="auto"
        overflowX="hidden"
        {...props}
      />
    </StickyChakra>
  )
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
  const ref = useRef<HTMLDivElement>(null);
  usePersistedScrollTop(ref);

  const [ifMobile] = useMediaQuery("(min-width: 832px)");
  const ifMobileFont = !ifDocs && ifMobile; // Just don't load all font list on mobile due to lag

  return (
    <SidebarContainer
      ref={ref}
      overflowX="hidden"
      textAlign={{ base: "center", md: "inherit" }}
      {...rest}
    >
      {ifDocs && (
        <>
          <SidebarHeading title={"Contents"} pt={{ base: 6, md: 2 }} />
          {docsList.map((page) => (
            <SidebarButton
              key={page.key}
              my={0.5}
              isOpen={isOpen}
              onToggle={onToggle}
              {...page}
            />
          ))}
        </>
      )}
      {ifMobileFont && (
        <>
          <SidebarHeading title={"Fonts"} pt={{ base: 6, md: 2 }} />
          {fontList.map((page) => (
            <SidebarButton
              key={page.key}
              isParent={false}
              isExternal={false}
              isOpen={isOpen}
              onToggle={onToggle}
              {...page}
            />
          ))}
        </>
      )}
    </SidebarContainer>
  );
};
