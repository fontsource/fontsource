import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";

const breakpoints = createBreakpoints({
  sm: "40em",
  md: "52em",
  lg: "64em",
  xl: "80em",
});

// Currently a bug with theme.config typings for initialColorMode. Workaround.
interface ThemeConfig {
  useSystemColorMode?: boolean;
  initialColorMode: "light" | "dark";
}

const config: ThemeConfig = {
  useSystemColorMode: false,
  initialColorMode: "light",
};

const fonts = {
  heading: `'RalewayVariable', sans-serif`,
  body: `'InterVariable', sans-serif`,
};

const colors = {
  black: "#111",
};

const theme = extendTheme({
  breakpoints,
  config,
  colors,
  fonts,
});

export default theme;
