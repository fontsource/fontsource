import { createStyles, Checkbox, Button, Menu } from "@mantine/core";
import { IconCaret } from "@components";

const useStyles = createStyles(theme => ({
  button: {
    padding: "2px 16px",
    height: "40px",
    width: "240px",
    border: `1px solid ${
      theme.colorScheme === "dark"
        ? theme.colors.border[1]
        : theme.colors.border[0]
    }`,
    borderRadius: "4px",

    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.background[2]
        : theme.colors.background[0],

    color:
      theme.colorScheme === "dark"
        ? theme.colors.text[0]
        : theme.colors.text[1],

    fontWeight: 400,
  },
}));

interface DropdownProps {
  data: string[];
  placeholder: string;
}

const Dropdown = ({ data, placeholder }: DropdownProps) => {
  const { classes } = useStyles();
  return (
    <Menu shadow="md" width={240} closeOnItemClick={false}>
      <Menu.Target>
        <Button
          className={classes.button}
          rightIcon={<IconCaret />}
          styles={{
            inner: {
              justifyContent: "space-between",
            },
          }}
        >
          {placeholder}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {data.map(label => (
          <Menu.Item key={label}>
            <Checkbox label={label} />
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
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
