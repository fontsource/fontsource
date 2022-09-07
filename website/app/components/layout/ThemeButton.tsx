import {
  ActionIcon,
  useMantineColorScheme,
  Image,
  Tooltip,
} from "@mantine/core";

const LightIcon = (
  <Image src="./icons/sun.svg" alt="Light mode icon" width={18} height={18} />
);

const DarkIcon = (
  <Image src="./icons/moon.svg" alt="Dark mode icon" width={18} height={18} />
);

export const ThemeButton = ({ ...others }) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  return (
    <Tooltip label={dark ? "Light mode" : "Dark mode"}>
      <ActionIcon
        variant="outline"
        color={dark ? "yellow" : "blue"}
        onClick={() => toggleColorScheme()}
        {...others}
      >
        {dark ? LightIcon : DarkIcon}
      </ActionIcon>
    </Tooltip>
  );
};
