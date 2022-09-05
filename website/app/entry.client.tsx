import { RemixBrowser } from "@remix-run/react";
import { hydrateRoot } from "react-dom/client";
import { ClientProvider } from "@mantine/remix";

hydrateRoot(
  document,
  <ClientProvider>
    <RemixBrowser />
  </ClientProvider>
);
