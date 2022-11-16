import type { DividerProps } from '@mantine/core';
import {
  Button,
  createStyles,
  Divider as MantineDivider,
  Menu,
  TextInput,
} from '@mantine/core';
import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { IconCaret } from '@/components';

import {
  previewInputViewAtom,
  previewLabelAtom,
  previewTypingAtom,
  previewValueAtom,
} from './atoms';

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0px 24px',
    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.colors.background[4]
        : theme.colors.background[0],
    borderBottom: `1px solid ${
      theme.colorScheme === 'dark' ? '#2C3651' : '#E1E3EC'
    }`,
    borderLeft: `1px solid ${
      theme.colorScheme === 'dark' ? '#2C3651' : '#E1E3EC'
    }`,
    borderRight: `1px solid ${
      theme.colorScheme === 'dark' ? '#2C3651' : '#E1E3EC'
    }`,

    '&:focus-within': {
      borderBottomColor: theme.colors.purple[0],
    },

    [`@media (max-width: ${theme.breakpoints.md}px)`]: {
      borderRight: 'none',
    },

    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      display: 'none'
    },
  },

  button: {
    padding: '2px 16px',
    height: '40px',

    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.colors.background[4]
        : theme.colors.background[0],

    color:
      theme.colorScheme === 'dark'
        ? theme.colors.text[0]
        : theme.colors.text[1],

    fontWeight: 400,

    '&:hover': {
      backgroundColor: theme.colors.purpleHover[0],
    },
  },

  separator: {
    boxSizing: 'border-box',
    textAlign: 'left',
    width: '100%',
    padding: '0px 2px',
  },

  separatorLabel: {
    color:
      theme.colorScheme === 'dark'
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

interface ItemButtonProps {
  label: string;
  setLabel: (label: React.SetStateAction<string>) => void;
  value: string;
  setValue: (value: React.SetStateAction<string>) => void;
}
const ItemButton = ({ label, setLabel, value, setValue }: ItemButtonProps) => {
  return (
    <Menu.Item
      component="button"
      onClick={() => {
        setLabel(label);
        setValue(value);
      }}
    >
      {value}
    </Menu.Item>
  );
};

const PreviewSelector = () => {
  const { classes } = useStyles();
  const [label, setLabel] = useAtom(previewLabelAtom);
  const [, setValue] = useAtom(previewValueAtom);
  const [inputView, setInputView] = useAtom(previewInputViewAtom);
  const [, setInputViewTyping] = useAtom(previewTypingAtom);

  useEffect(() => {
    if (label !== 'Custom') {
      setInputView('');
    }
  }, [label, setInputView]);

  return (
    <div className={classes.wrapper}>
      <Menu shadow="md">
        <Menu.Target>
          <Button
            className={classes.button}
            rightIcon={<IconCaret />}
            styles={{
              inner: {
                justifyContent: 'space-between',
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
            setLabel={setLabel}
            setValue={setValue}
          />
          <ItemButton
            label="Sentence"
            value="Sphinx of black quartz, judge my vow."
            setLabel={setLabel}
            setValue={setValue}
          />
          <Divider label="Alphabets" />
          <ItemButton
            label="Alphabet"
            value="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            setLabel={setLabel}
            setValue={setValue}
          />
          <ItemButton
            label="Alphabet"
            value="abcdefghijklmnopqrstuvwxyz"
            setLabel={setLabel}
            setValue={setValue}
          />
          <Divider label="Numbers" />
          <ItemButton
            label="Number"
            value="0123456789"
            setLabel={setLabel}
            setValue={setValue}
          />
          <Divider label="Symbols" />
          <ItemButton
            label="Symbol"
            value="!@#$%^&*()_+-=[]{}|;':,./<>?"
            setLabel={setLabel}
            setValue={setValue}
          />
        </Menu.Dropdown>
      </Menu>
      <TextInput
        value={inputView}
        onChange={setInputViewTyping}
        placeholder="Type something"
        variant="unstyled"
        styles={(theme) => ({
          root: {
            width: '60%',
          },
          input: {
            backgroundColor:
              theme.colorScheme === 'dark'
                ? theme.colors.background[4]
                : theme.colors.background[0],
          },
        })}
      />
    </div>
  );
};

export { PreviewSelector };
