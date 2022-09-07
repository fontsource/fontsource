import { Global } from "@mantine/core";

export const GlobalStyles = () => (
  <Global
    styles={theme => ({
      header: {
        backgroundColor:
          theme.colorScheme === "dark"
            ? theme.colors.background[3]
            : theme.colors.background[1],
      },
      body: {
        color:
          theme.colorScheme === "dark"
            ? theme.colors.text[0]
            : theme.colors.text[1],

        fontSize: theme.fontSizes.md,
        lineHeight: "160%",
      },
    })}
  />
);
