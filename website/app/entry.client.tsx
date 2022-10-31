import { ClientProvider } from "@mantine/remix";
import { RemixBrowser } from "@remix-run/react";
import { hydrate } from "react-dom";

hydrate(
  <ClientProvider>
    <RemixBrowser />
  </ClientProvider>,
  document
);
