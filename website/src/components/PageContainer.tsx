import { FlexProps, useColorModeValue } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

import { Container } from "./Container";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar/Navbar";
import { Sidebar } from "./Sidebar";

interface SidebarProp {
  ifSidebar?: boolean;
  ifDocs: boolean;
}

export type PageContainerProps = PropsWithChildren<FlexProps> & SidebarProp;

export const PageContainer = ({
  ifSidebar = true,
  ifDocs,
  children,
  ...props
}: PageContainerProps) => {
  const bgColor = useColorModeValue("white", "gray.900");
  const color = useColorModeValue("black", "white");

  return (
    <Container minHeight="100vh" bg={bgColor} color={color} {...props}>
      <Navbar />
      <Container flexDirection="row" alignItems="start">
        {ifSidebar && (
          <Sidebar
            ifDocs={ifDocs}
            minWidth="25%"
            display={{ base: "none", md: "block" }}
          />
        )}
        {children}
      </Container>
      <Footer />
    </Container>
  );
};
