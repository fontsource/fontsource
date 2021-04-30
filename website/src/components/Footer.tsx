import { Button, Flex, FlexProps, Link } from "@chakra-ui/react";
import { AiFillGithub } from "react-icons/ai";

export const Footer = (props: FlexProps) => (
  <Flex
    as="footer"
    mt="auto"
    px={8}
    py={4}
    width="100%"
    justify="space-between"
    maxWidth="72rem"
    {...props}
  >
    <Link href="https://github.com/DecliningLotus" isExternal>
      <Button variant="ghost" size="sm">
        Developed by Lotus
      </Button>
    </Link>
    <Link href="https://github.com/fontsource/fontsource" isExternal>
      <Button variant="ghost" size="sm" rightIcon={<AiFillGithub />}>
        GitHub
      </Button>
    </Link>
  </Flex>
);
