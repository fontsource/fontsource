import { Fade, Stack, StackProps } from "@chakra-ui/react";

export const Main = (props: StackProps) => (
  <Fade in={true}>
    <Stack
      spacing="1.5rem"
      width="100%"
      maxWidth="48rem"
      pt="2rem"
      px="1rem"
      {...props}
    />
  </Fade>
);
