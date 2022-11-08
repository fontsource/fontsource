import { Dropdown, IconGrid, IconList } from '@components';
import { Center, createStyles, Group, SegmentedControl, Text } from '@mantine/core';
import { useAtom } from 'jotai';

import { displayAtom, sortAtom } from './atoms';

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
  const [currentItem, setCurrentItem] = useAtom(sortAtom);
  const [display, setDisplay] = useAtom(displayAtom);
  return (
    <div className={classes.wrapper}>
      <Text>{count} families loaded</Text>
      <Group>
        <Dropdown label={currentItem} width={120}> 
          Wow
        </Dropdown>
        <Group>
          <Text>Display</Text>
          <SegmentedControl value={display} onChange={setDisplay} data={[
            { label: (<Center><IconGrid height={20}/></Center>), value: 'grid' },
            { label: (<Center><IconList height={20} /></Center>), value: 'list' },
          ]} />
        </Group>
      </Group>
    </div>
  );
};

export { Sort };
