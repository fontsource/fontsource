import { FlexProps, useColorModeValue } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

import { Container } from "./Container";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar/Navbar";
import { Sidebar } from "./Sidebar";

interface SidebarProp {
  ifSidebar?: boolean;
}

export type PageContainerProps = PropsWithChildren<FlexProps> & SidebarProp;

export const PageContainer = ({
  ifSidebar = true,
  children,
  ...props
}: PageContainerProps) => {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const color = useColorModeValue("black", "white");

  return (
    <Container minHeight="100vh" bg={bgColor} color={color} {...props}>
      <Navbar />
      <Container flexDirection="row">
        {ifSidebar && <Sidebar minWidth="30%" />}
        <Container minWidth="70%">{children}</Container>
      </Container>
      <Footer />
    </Container>
  );
};
