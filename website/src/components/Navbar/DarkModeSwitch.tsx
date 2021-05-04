import { IconButton, useColorMode } from "@chakra-ui/react";
import { CgDarkMode } from "react-icons/cg";

export const DarkModeSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label={`Toggle ${colorMode} mode`}
      variant="ghost"
      fontSize="xl"
      onClick={toggleColorMode}
      icon={<CgDarkMode />}
    />
  );
};
