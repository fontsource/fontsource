import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";

const breakpoints = createBreakpoints({
  sm: "40em",
  md: "52em",
  lg: "64em",
  xl: "80em",
});

const config = {
  useSystemColorMode: false,
  initialColorMode: "light",
};

const fonts = {
  heading: `'Inter', sans-serif`,
  body: `'Inter', sans-serif`,
};

const colors = {
  black: "#16161D",
};

const theme = extendTheme({
  breakpoints,
  colors,
  config,
  fonts,
});

export default theme;
