import { gray, grayDark } from "@radix-ui/colors";
import { createStitches } from "@stitches/react";

import utils from "./utils";

const breakpoints = {
	media: {
		sm: "(min-width: 640px)",
		md: "(min-width: 768px)",
		lg: "(min-width: 1024px)",
		xl: "(min-width: 1280px)",
		"2xl": "(min-width: 1536px)",
	},
};

const sizes = {
	0: "0px",
	1: "2px",
	2: "4px",
	3: "8px",
	4: "12px",
	5: "16px",
	6: "24px",
	7: "32px",
	8: "40px",
	9: "48px",
	10: "56px",
	11: "64px",
	12: "80px",
	13: "96px",
	14: "128px",
	15: "256px",
	16: "512px",
};

export const { styled, getCssText, createTheme, globalCss, keyframes } = createStitches({
	...breakpoints,
	...utils,
	theme: {
		colors: {
			...gray,
		},
		sizes,
	},
});

export const darkTheme = createTheme({
	colors: {
		...grayDark,
	},
});

export const globalStyles = globalCss({
	body: {
		background: "$gray1",
		color: "$gray12",
		fontFamily: `"Helvetica Neue", HelveticaNeue, "TeX Gyre Heros", TeXGyreHeros, FreeSans, "Nimbus Sans L", "Liberation Sans", Arimo, Helvetica, Arial, sans-serif;`,
	},
	code: {
		fontFamily: `'Roboto MonoVariable', monospace`,
	},
	heading: {
		fontFamily: `"Helvetica Neue", HelveticaNeue, "TeX Gyre Heros", TeXGyreHeros, FreeSans, "Nimbus Sans L", "Liberation Sans", Arimo, Helvetica, Arial, sans-serif;`,
	},
});
