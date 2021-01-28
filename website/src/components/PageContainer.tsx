import { FlexProps, useColorModeValue } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

import { Container } from "./Container";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar/Navbar";

export type PageContainerProps = PropsWithChildren<FlexProps>;

export const PageContainer = ({ children, ...props }: PageContainerProps) => {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const color = useColorModeValue("black", "white");

  return (
    <Container minHeight="100vh" bg={bgColor} color={color} {...props}>
      <Navbar />
      {children}
      <Footer />
    </Container>
  );
};
