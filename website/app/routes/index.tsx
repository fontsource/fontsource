import { Box, Text, Container } from "@mantine/core";
import { FontSearchDummy } from "~/components/search/FontSearch";

export default function Index() {
  const test = "";
  return (
    <>
      <FontSearchDummy />
      <Container
        sx={{
          maxWidth: "1440px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "0px 64px",
        }}
      >
        <Text>Test</Text>
        test
      </Container>
    </>
  );
}
