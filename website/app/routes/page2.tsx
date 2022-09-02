import { Link } from "@remix-run/react";
import { Container } from "@components";

export default function Page2() {
  return (
    <Container>
      <h1>Page 2</h1>
      <p>This route works fine.</p>
      <Link to="/">Back to home</Link>
    </Container>
  );
}
