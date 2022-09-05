import { Link } from "@remix-run/react";
import { Container, Text, Stack, Button } from "@mantine/core";
import { ThemeButton } from "@components";

export default function Index() {
  return (
    <Container>
      <h1>Welcome to Remix with Stitches Example</h1>
      <ThemeButton />
      <ul>
        <li>
          <Link to="/page2">Jokes</Link>
        </li>
        <li>
          <Link to="/test/test-error">Jokes: Error</Link>
        </li>
      </ul>
      <Stack align="center" mt={50}>
        <Text size="xl" weight={500}>
          Welcome to Mantine!
        </Text>
        <Button>Click the button</Button>
      </Stack>
    </Container>
  );
}
