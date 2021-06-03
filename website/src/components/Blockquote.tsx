import { Alert, useColorModeValue } from "@chakra-ui/react";

export const BlockQuote = (props) => {
  const borderColor = useColorModeValue("gray.300", "gray.700");
  const bgColor = useColorModeValue("gray.100", "gray.800");
  return (
    <Alert
      as="blockquote"
      variant="left-accent"
      background={bgColor}
      borderInlineStartColor={borderColor}
      py={0}
      mt={2}
      {...props}
    />
  );
};
