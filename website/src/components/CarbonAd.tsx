import { chakra, SystemStyleObject, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

const loadScript = (container: HTMLElement) => {
  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.src =
    "//cdn.carbonads.com/carbon.js?serve=CEAI42QN&placement=fontsourceorg";
  container.appendChild(script);
  return script;
};

export const CarbonAd = () => {
  const ref = useRef(null);
  const bgColor = useColorModeValue("gray.100", "gray.800");

  const carbonAd: SystemStyleObject = {
    display: "block",
    position: "relative",
    margin: "32px 0",
    maxWidth: "400px",
    borderRadius: "4px",
    bgColor,
    color: "inherit",
    "@media (max-width: 480px)": {
      fontSize: "0.875em",
    },
    a: {
      textDecoration: "none",
      color: "inherit",
      "&:hover": {
        textDecoration: "underline",
      },
    },
    ".carbon-wrap": {
      display: "flex",
      padding: "16px",
    },
    ".carbon-img": {
      marginRight: "16px",
      img: {
        display: "block",
      },
    },
    ".carbon-text": {
      fontSize: "0.8rem",
      lineHeight: 1.4,
    },
    ".carbon-poweredby": {
      position: "absolute",
      bottom: "16px",
      right: "16px",
      color: `${bgColor} !important`,
      display: "block",
      fontSize: "10px",
      fontWeight: "semibold",
      textTransform: "uppercase",
      lineHeight: 1,
      letterSpacing: "0.2px",
    },
  };

  useEffect(() => {
    const scriptEl = document.getElementById("_carbonads_js");

    if (!ref.current || !!scriptEl) return;

    const script = loadScript(ref.current);
    script.id = "_carbonads_js";
  }, []);

  return <chakra.span id="carbon-ad" ref={ref} sx={carbonAd} />;
};
