import { Stack, StackProps } from "@chakra-ui/react";

export const Main = (props: StackProps) => (
  <Stack
    spacing="1.5rem"
    pt="2rem"
    px={{
      sm: "0.5rem",
      md: "1rem",
    }}
    {...props}
  />
);
