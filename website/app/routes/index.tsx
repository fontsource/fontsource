import { Link } from "@remix-run/react";
import { Container } from "@components";

export default function Index() {
  return (
    <Container>
      <h1>Welcome to Remix with Stitches Example</h1>
      <ul>
        <li>
          <Link to="/page2">Jokes</Link>
        </li>
        <li>
          <Link to="/test/test-error">Jokes: Error</Link>
        </li>
      </ul>
    </Container>
  );
}
