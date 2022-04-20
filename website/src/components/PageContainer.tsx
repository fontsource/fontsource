import { Box, FlexProps, useColorModeValue } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { PropsWithChildren, useEffect, useState } from "react";

import { Container } from "./Container";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar/Navbar";
import { Sidebar } from "./Sidebar";

export type PageContainerProps = PropsWithChildren<FlexProps>;

export const PageContainer = ({ children, ...props }: PageContainerProps) => {
  const bgColor = useColorModeValue("white", "gray.900");
  const color = useColorModeValue("black", "white");

  // useLayoutEffect in Sidebar.tsx returns SSR error - https://reactjs.org/link/uselayouteffect-ssr
  const [showSidebar, setShowSidebar] = useState(false);
  // Wait until after client-side hydration to show
  useEffect(() => {
    setShowSidebar(true);
  }, []);

  const { pathname } = useRouter();

  if (pathname === "/_error") return <>{children}</>;

  const ifDocs = pathname.startsWith("/docs");
  const ifFonts = pathname.startsWith("/fonts");

  const ifSidebar = ifDocs || ifFonts;

  let sidebar;
  if (showSidebar) {
    sidebar = (
      <Sidebar
        ifDocs={ifDocs}
        minWidth="260px"
        display={{ base: "none", md: "block" }}
        pl={4}
      />
    );
  } else {
    return null; // TODO: make placeholder
  }

  return (
    <Box bg={bgColor} color={color}>
      <Container minHeight="100vh" maxWidth="72rem" mx="auto" {...props}>
        <Navbar ifDocs={ifDocs} />
        <Container px={8} flexDirection="row" alignItems="flex-start">
          {ifSidebar && sidebar}
          {children}
        </Container>
        <Footer />
      </Container>
    </Box>
  );
};
