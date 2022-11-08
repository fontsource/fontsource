import { IconCaret } from '@components'
import { Button, createStyles, Menu, ScrollArea } from '@mantine/core';

interface DropdownProps {
  label: string
  width?: number
  children: React.ReactNode
  icon?: React.ReactNode
}

const useStyles = createStyles((theme) => ({
  button: {
    padding: '2px 16px',
    height: '40px',
    border: `1px solid ${
      theme.colorScheme === 'dark'
        ? theme.colors.border[1]
        : theme.colors.border[0]
    }`,
    borderRadius: '4px',

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

const Dropdown = ({ label, icon, width, children }: DropdownProps) => {
  const { classes } = useStyles();
  return (
    <Menu shadow="md" width={width ?? 240} closeOnItemClick={false}>
      <Menu.Target>
        <Button
          className={classes.button}
          rightIcon={icon ?? <IconCaret />}
          styles={{
            root: {
              width: `${width ?? 240}px`,
            },
            inner: {
              justifyContent: 'space-between',
            },
          }}
        >
          {label}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <ScrollArea style={{ height: '240px' }}>
          {children}
        </ScrollArea>
      </Menu.Dropdown>
    </Menu>
  );
};

export {Dropdown}
