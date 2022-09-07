import { useMantineTheme } from "@mantine/core";
import { IconProps } from "./types";

const IconGithub = ({ height, ...others }: IconProps) => {
  const theme = useMantineTheme();
  const stroke =
    theme.colorScheme === "dark" ? theme.colors.text[0] : theme.colors.text[1];

  return (
    <svg
      height={height ?? 18}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...others}
    >
      <path
        d="M13.3333 18.3333V15.1083C13.3646 14.711 13.3109 14.3115 13.1758 13.9365C13.0408 13.5615 12.8274 13.2195 12.55 12.9333C15.1667 12.6417 17.9167 11.65 17.9167 7.1C17.9164 5.93652 17.4689 4.81766 16.6667 3.975C17.0465 2.95709 17.0197 1.83196 16.5917 0.833332C16.5917 0.833332 15.6083 0.541666 13.3333 2.06667C11.4233 1.54902 9.40998 1.54902 7.49999 2.06667C5.22499 0.541666 4.24166 0.833332 4.24166 0.833332C3.81364 1.83196 3.78678 2.95709 4.16666 3.975C3.35843 4.82392 2.91043 5.95288 2.91666 7.125C2.91666 11.6417 5.66666 12.6333 8.28332 12.9583C8.00915 13.2416 7.79771 13.5795 7.66275 13.9499C7.52778 14.3204 7.47233 14.7151 7.49999 15.1083V18.3333M7.49999 15.8333C3.33332 17.0833 3.33332 13.75 1.66666 13.3333L7.49999 15.8333Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { IconGithub };
