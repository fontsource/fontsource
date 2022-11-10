import { Container } from '@mantine/core';
import { Outlet, useCatch } from '@remix-run/react';

// Workaround for styles not loading on boundaries - https://github.com/remix-run/remix/issues/1136
export default function Boundary() {
    return (
        <Outlet />
    )
}

export function CatchBoundary() {
  const caught = useCatch();
  return (
      <Container>
        <p>
          [CatchBoundary]: {caught.status} {caught.statusText}
        </p>
      </Container>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
      <Container>
        <p>[ErrorBoundary]: There was an error: {error.message}</p>
      </Container>
  );
}
