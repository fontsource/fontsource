import {
  TextInput,
  TextInputProps,
  Menu,
  createStyles,
  Button,
  Divider as MantineDivider,
  DividerProps,
} from "@mantine/core";
import { IconCaret, IconSearch } from "@components";
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

  button: {
    padding: "2px 16px",
    height: "40px",

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

  separator: {
    boxSizing: "border-box",
    textAlign: "left",
    width: "100%",
    padding: "0px 2px",
  },

  separatorLabel: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[3]
        : theme.colors.gray[5],
  },
}));

const Divider = ({ label, ...others }: DividerProps) => {
  const { classes } = useStyles();
  return (
    <div className={classes.separator}>
      <MantineDivider
        classNames={{ label: classes.separatorLabel }}
        label={label}
        {...others}
      />
    </div>
  );
};

const PreviewSelector = ({ value, onChange, ...others }: TextInputProps) => {
  const { classes } = useStyles();
  return (
    <div className={classes.wrapper}>
      <Menu shadow="md">
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
            Custom
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>
            <Divider label="Sentences" />
          </Menu.Item>
          <Menu.Item>The quick brown fox jumps over the lazy dog.</Menu.Item>
          <Menu.Item>Sphinx of black quartz, judge my vow.</Menu.Item>
          <Menu.Item>
            <Divider label="Custom" />
          </Menu.Item>
          <Menu.Item>Custom</Menu.Item>
          <Menu.Item>
            <Divider label="Alphabets" />
          </Menu.Item>
          <Menu.Item>ABCDEFGHIJKLMNOPQRSTUVWXYZ</Menu.Item>
          <Menu.Item>abcdefghijklmnopqrstuvwxyz</Menu.Item>
          <Menu.Item>
            <Divider label="Numbers" />
          </Menu.Item>
          <Menu.Item>0123456789</Menu.Item>
          <Menu.Item>
            <Divider label="Symbols" />
          </Menu.Item>
          <Menu.Item>!@#$%^&amp;*()_+-=[]{}|;':,./&lt;&gt;?</Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <TextInput
        value={value}
        onChange={onChange}
        placeholder="Type something"
        variant="unstyled"
        styles={theme => ({
          root: {
            width: "60%",
          },
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
