import { RemixBrowser } from "@remix-run/react";
import { hydrate } from "react-dom";
import { ClientProvider } from "@mantine/remix";

hydrate(
  <ClientProvider>
    <RemixBrowser />
  </ClientProvider>,
  document
);
