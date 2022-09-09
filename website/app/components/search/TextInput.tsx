import { TextInput, TextInputProps, Select, createStyles } from "@mantine/core";
import { IconSearch } from "@components";
import { useFocusWithin } from "@mantine/hooks";

const SearchBar = ({ value, onChange, ...others }: TextInputProps) => {
  const { ref, focused } = useFocusWithin();
  return (
    <TextInput
      value={value}
      onChange={onChange}
      placeholder="Search fonts"
      variant="unstyled"
      sx={theme => ({
        paddingLeft: 24,
        borderRadius: "4px 0px 0px 0px",
        borderBottom: `1px solid ${
          theme.colorScheme === "dark"
            ? theme.colors.border[1]
            : theme.colors.border[0]
        }`,

        "&:focus-within": {
          borderColor: theme.colors.purple[0],
        },
      })}
      styles={theme => ({
        input: {
          padding: "24px",
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.background[2]
              : theme.colors.background[0],

          height: "64px",

          "&:focus-within": {
            color: theme.colors.purple[0],
          },
        },
      })}
      ref={ref}
      icon={<IconSearch active={focused} />}
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
