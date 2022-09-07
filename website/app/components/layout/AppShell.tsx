import {
  AppShell as MantineAppShell,
  Navbar,
  Footer,
  Text,
} from "@mantine/core";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <MantineAppShell
      footer={
        <Footer height={60} p="md">
          Application footer
        </Footer>
      }
      header={<Header />}
    >
      {children}
    </MantineAppShell>
  );
};
