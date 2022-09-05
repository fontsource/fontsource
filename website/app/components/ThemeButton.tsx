import { ActionIcon, useMantineColorScheme, Image } from "@mantine/core";

const LightIcon = (
  <Image src="./icons/sun.svg" alt="Light mode icon" width={18} height={18} />
);

const DarkIcon = (
  <Image src="./icons/moon.svg" alt="Dark mode icon" width={18} height={18} />
);

export const ThemeButton = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  return (
    <ActionIcon
      variant="outline"
      color={dark ? "yellow" : "blue"}
      onClick={() => toggleColorScheme()}
      title="Toggle color scheme"
    >
      {dark ? LightIcon : DarkIcon}
    </ActionIcon>
  );
};
