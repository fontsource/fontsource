import { Flex, FlexProps, Text } from "@chakra-ui/react";

export const Footer = (props: FlexProps) => (
  <Flex
    as="footer"
    mt="auto"
    px={8}
    pb={4}
    width="100%"
    justify="space-between"
    {...props}
  >
    <Text>Developed by Lotus</Text>
    <Text>GitHub</Text>
  </Flex>
);
