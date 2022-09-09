import {
  MultiSelect,
  MultiSelectProps,
  createStyles,
  Box,
  SelectItemProps,
  Checkbox,
  Button,
  Text,
  Popover,
  CheckboxProps,
} from "@mantine/core";
import React, { forwardRef } from "react";

const useStyles = createStyles(theme => ({
  dropdown: {
    padding: "2px 16px",
    height: "40px",
    width: "240px",
    border: `1px solid ${
      theme.colorScheme === "dark"
        ? theme.colors.border[1]
        : theme.colors.border[0]
    }`,
    borderRadius: "4px",
  },
}));

interface DropdownProps {
  data: string[];
  placeholder: string;
}

const Dropdown = ({ data, placeholder }: DropdownProps) => {
  const { classes } = useStyles();
  return (
    <Popover width={200} trapFocus position="bottom" shadow="md">
      <Popover.Target>
        <Button variant="subtle" className={classes.dropdown}>
          {placeholder}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        {data.map(label => (
          <Checkbox label={label} />
        ))}
      </Popover.Dropdown>
    </Popover>
  );
};

const LanguagesDropdown = () => {
  return (
    <Dropdown
      data={[
        "Arabic",
        "Japanese",
        "Chinese (Hong Kong)",
        "Chinese (Simplified)",
        "Chinese (Traditional)",
        "Latin",
      ]}
      placeholder="All languages"
    />
  );
};

const CategoriesDropdown = () => {
  return (
    <Dropdown
      data={[
        "Serif",
        "Sans Serif",
        "Display",
        "Handwriting",
        "Monospace",
        "Other",
      ]}
      placeholder="All categories"
    />
  );
};

export { LanguagesDropdown, CategoriesDropdown };
