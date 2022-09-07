import { TextInput, TextInputProps, Select, createStyles } from "@mantine/core";
import { IconSearch } from "@components";

const SearchBar = ({ value, onChange, ...others }: TextInputProps) => {
  return (
    <TextInput
      value={value}
      onChange={onChange}
      placeholder="Search fonts"
      variant="unstyled"
      styles={theme => ({
        input: {
          padding: "24px",
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.background[2]
              : theme.colors.background[0],
          borderBottom: `1px solid ${
            theme.colorScheme === "dark" ? "#2C3651" : "#E1E3EC"
          }`,
          borderRadius: "4px 0px 0px 0px",
          height: "64px",

          "&:focus-within": {
            borderColor: theme.colors.purple[0],
          },
        },
      })}
      icon={<IconSearch />}
      {...others}
    />
  );
};

const useStyles = createStyles(theme => ({
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0px 24px",
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.background[2]
        : theme.colors.background[0],
    borderBottom: `1px solid ${
      theme.colorScheme === "dark" ? "#2C3651" : "#E1E3EC"
    }`,
    borderLeft: `1px solid ${
      theme.colorScheme === "dark" ? "#2C3651" : "#E1E3EC"
    }`,
    borderRight: `1px solid ${
      theme.colorScheme === "dark" ? "#2C3651" : "#E1E3EC"
    }`,

    "&:focus-within": {
      borderBottomColor: theme.colors.purple[0],
    },
  },
}));

const PreviewSelector = ({ value, onChange, ...others }: TextInputProps) => {
  const { classes } = useStyles();
  return (
    <div className={classes.wrapper}>
      <Select
        placeholder="Custom"
        variant="unstyled"
        data={[
          {
            value: "sentence1",
            label: "The quick brown fox jumps over the lazy dog.",
            group: "Sentences",
          },
          {
            value: "sentence2",
            label: "Sphinx of black quartz, judge my vow.",
            group: "Sentences",
          },
          { value: "custom", label: "Enter any custom input", group: "Custom" },
          {
            value: "alphabet1",
            label: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            group: "Alphabets",
          },
          {
            value: "alphabet2",
            label: "abcdefghijklmnopqrstuvwxyz",
            group: "Alphabets",
          },
          {
            value: "number1",
            label: "0123456789",
            group: "Numbers",
          },
          {
            value: "symbol1",
            label: "!@#$%^&*()_+-=[]{}|;':,./<>?",
            group: "Symbols",
          },
        ]}
      />
      <TextInput
        value={value}
        onChange={onChange}
        placeholder="Type something"
        variant="unstyled"
        styles={theme => ({
          input: {
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.background[2]
                : theme.colors.background[0],
          },
        })}
        {...others}
      />
    </div>
  );
};

export { SearchBar, PreviewSelector };
