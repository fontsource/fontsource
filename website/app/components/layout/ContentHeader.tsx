import type { ContainerProps } from '@mantine/core';
import { Box, Container, createStyles } from '@mantine/core';

const useStyles = createStyles((theme) => ({
  header: {
    background:
      theme.colorScheme === 'dark'
        ? theme.colors.background[5]
        : theme.colors.background[1],
  },
  inner: {
    maxWidth: '1440px',
    marginLeft: 'auto',
    marginRight: 'auto',
    height: '144px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '64px 64px 40px',
  },
}));

export const ContentHeader = ({ ...other }: ContainerProps) => {
  const { classes } = useStyles();

  return (
    <Box component="header" className={classes.header}>
      <Container className={classes.inner} {...other} />
    </Box>
  );
};
