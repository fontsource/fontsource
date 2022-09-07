import { MultiSelect, MultiSelectProps } from "@mantine/core";

const Dropdown = ({ data, placeholder, ...others }: MultiSelectProps) => {
  return (
    <MultiSelect
      sx={{ padding: "12px 24px 24px 24px", height: 64 }}
      data={data}
      placeholder={placeholder}
      searchable
      nothingFound="Nothing found"
      clearButtonLabel="Clear selection"
      clearable
      variant="unstyled"
      {...others}
    />
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
