import {
  Slider as MantineSlider,
  SliderProps,
  createStyles,
  Text,
  Grid,
} from "@mantine/core";

const useStyles = createStyles(theme => ({
  wrapper: {
    padding: "0px 24px",
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.background[2]
        : theme.colors.background[0],
    borderBottom: `1px solid ${
      theme.colorScheme === "dark" ? "#2C3651" : "#E1E3EC"
    }`,
    borderRadius: "0px 4px 0px 0px",

    "&:focus-within": {
      borderColor: theme.colors.purple[0],
    },
  },
}));

const SizeSlider = ({ value, onChange, ...others }: SliderProps) => {
  const { classes } = useStyles();
  return (
    <Grid
      grow
      gutter={0}
      justify="center"
      align="center"
      className={classes.wrapper}
    >
      <Grid.Col span={2}>
        <Text>{value} px</Text>
      </Grid.Col>
      <Grid.Col span={8}>
        <MantineSlider
          color="indigo"
          value={value}
          onChange={onChange}
          {...others}
        />
      </Grid.Col>
    </Grid>
  );
};

export { SizeSlider };
