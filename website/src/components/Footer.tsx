import {
  Box,
  Button,
  Flex,
  FlexProps,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";
import Image from "next/image";
import { AiFillGithub } from "react-icons/ai";

export const Footer = (props: FlexProps) => {
  const logoURL = useColorModeValue(
    "/vercel-logotype-dark.svg",
    "/vercel-logotype-light.svg"
  );
  return (
    <Flex
      as="footer"
      mt="auto"
      px={8}
      py={4}
      width="100%"
      align={{ base: "center", sm: "inherit" }}
      justify={{ sm: "space-between" }}
      maxWidth="72rem"
      direction={{ base: "column", sm: "row" }}
      {...props}
    >
      <Link href="https://vercel.com/?utm_source=fontsource&utm_campaign=oss" isExternal>
        <Button
          variant="ghost"
          size="sm"
          rightIcon={
            <Box ml={-2}>
              <Image
                src={logoURL}
                height="18px"
                width="100px"
                priority={true}
              />
            </Box>
          }
        >
          Powered by
        </Button>
      </Link>
      <Link href="https://github.com/fontsource/fontsource" isExternal>
        <Button variant="ghost" size="sm" rightIcon={<AiFillGithub />}>
          GitHub
        </Button>
      </Link>
    </Flex>
  );
};
