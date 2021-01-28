import { Flex, FlexProps } from "@chakra-ui/react";

export const Container = (props: FlexProps) => {
  return (
    <Flex
      direction="column"
      alignItems="center"
      justifyContent="flex-start"
      {...props}
    />
  );
};
