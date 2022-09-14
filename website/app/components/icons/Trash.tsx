import { useMantineTheme } from "@mantine/core";

import type { IconProps } from "./types";

const IconTrash = ({ height, ...others }: IconProps) => {
  const theme = useMantineTheme();
  const stroke =
    theme.colorScheme === "dark" ? theme.colors.text[0] : theme.colors.text[1];

  return (
    <svg
      height={height ?? 20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...others}
    >
      <path
        d="M2 5H3.77778H18"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.8333 4.99999L15.8333 16.6667C15.8333 17.1087 15.6577 17.5326 15.3452 17.8452C15.0326 18.1577 14.6087 18.3333 14.1667 18.3333H5.83333C5.3913 18.3333 4.96738 18.1577 4.65482 17.8452C4.34226 17.5326 4.16666 17.1087 4.16666 16.6667L3.16666 4.99999M6.66666 4.99999V3.33332C6.66666 2.8913 6.84226 2.46737 7.15482 2.15481C7.46738 1.84225 7.8913 1.66666 8.33333 1.66666H11.6667C12.1087 1.66666 12.5326 1.84225 12.8452 2.15481C13.1577 2.46737 13.3333 2.8913 13.3333 3.33332V4.99999"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33334 9.16666V14.1667"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6667 9.16666V14.1667"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { IconTrash };
