import {
  TextInput,
  Menu,
  createStyles,
  Button,
  Divider as MantineDivider,
  DividerProps,
} from "@mantine/core";
import { IconCaret } from "@components";
import { PreviewProps } from "./types";

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

    "&:hover": {
      backgroundColor: theme.colors.purpleHover[0],
    },
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
    <Menu.Item disabled>
      <div className={classes.separator}>
        <MantineDivider
          classNames={{ label: classes.separatorLabel }}
          label={label}
          {...others}
        />
      </div>
    </Menu.Item>
  );
};

const ItemButton = ({
  labelChange,
  label,
  onChangeValue,
  value,
}: Omit<PreviewProps, "onChangeEvent" | "inputView">) => {
  return (
    <Menu.Item
      component="button"
      onClick={() => {
        labelChange(label);
        onChangeValue(value);
      }}
    >
      {value}
    </Menu.Item>
  );
};

const PreviewSelector = ({
  label,
  labelChange,
  inputView,
  onChangeEvent,
  onChangeValue,
}: Omit<PreviewProps, "value">) => {
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
            {label}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Divider label="Sentences" />
          <ItemButton
            label="Sentence"
            value="The quick brown fox jumps over the lazy dog."
            labelChange={labelChange}
            onChangeValue={onChangeValue}
          />
          <ItemButton
            label="Sentence"
            value="Sphinx of black quartz, judge my vow."
            labelChange={labelChange}
            onChangeValue={onChangeValue}
          />
          <Divider label="Alphabets" />
          <ItemButton
            label="Alphabet"
            value="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            labelChange={labelChange}
            onChangeValue={onChangeValue}
          />
          <ItemButton
            label="Alphabet"
            value="abcdefghijklmnopqrstuvwxyz"
            labelChange={labelChange}
            onChangeValue={onChangeValue}
          />
          <Divider label="Numbers" />
          <ItemButton
            label="Number"
            value="0123456789"
            labelChange={labelChange}
            onChangeValue={onChangeValue}
          />
          <Divider label="Symbols" />
          <ItemButton
            label="Symbol"
            value="!@#$%^&*()_+-=[]{}|;':,./<>?"
            labelChange={labelChange}
            onChangeValue={onChangeValue}
          />
        </Menu.Dropdown>
      </Menu>
      <TextInput
        value={inputView}
        onChange={onChangeEvent}
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
      />
    </div>
  );
};

export { PreviewSelector };
