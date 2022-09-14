import { AppShell as MantineAppShell, Footer } from "@mantine/core";

import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <MantineAppShell
      padding={0}
      header={<Header />}
      footer={
        <Footer height={60} p="md">
          Application footer
        </Footer>
      }
    >
      {children}
    </MantineAppShell>
  );
};
