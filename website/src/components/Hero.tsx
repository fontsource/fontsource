import { Flex, Heading } from "@chakra-ui/react";

export const Hero = ({ title }: { title: string }) => (
  <Flex justifyContent="center" alignItems="center" height="20vh">
    <Heading fontSize={{ base: "6vw", xl: "75px" }}>{title}</Heading>
  </Flex>
);

Hero.defaultProps = {
  title: "next-lotus-starter",
};
