import { Dropdown, IconCaret } from '@components';
import { Button, createStyles, Group, Menu, ScrollArea,Text } from '@mantine/core';
import { useState } from 'react';

const useStyles = createStyles((theme) => ({
  container: {
    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.colors.background[4]
        : theme.colors.background[0],
    borderRadius: '4px',
    height: 128,
  },

  wrapper: {
    display: 'flex',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0px 24px',
    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.colors.background[4]
        : theme.colors.background[0],

    '&:focus-within': {
      borderBottomColor: theme.colors.purple[0],
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
}));

interface SortProps {
  count: number;
}

const Sort = ({ count }: SortProps) => {
  const { classes } = useStyles();
  const [currentItem, setCurrentItem] = useState('Popular first');
  return (
    <div className={classes.wrapper}>
      <Text>{count} families loaded</Text>
      <Group>
        <Dropdown label={currentItem} width={120}>
          Wow
        </Dropdown>
      </Group>
    </div>
  );
};

export { Sort };
