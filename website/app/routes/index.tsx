import { Link } from "@remix-run/react";

import { styled } from "../styles/stitches.config";

const Container = styled("div", {
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.4,
  backgroundColor: "#999",
});

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
