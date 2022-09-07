import { AppShell as MantineAppShell, Footer, Box } from "@mantine/core";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <MantineAppShell
      header={<Header />}
      footer={
        <Footer height={60} p="md">
          Application footer
        </Footer>
      }
    >
      <Box
        sx={{
          maxWidth: "1440px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "0px 64px",
        }}
      >
        {children}
      </Box>
    </MantineAppShell>
  );
};
