import { observer } from '@legendapp/state/react';
import { Grid, Slider as MantineSlider, Text } from '@mantine/core';

import type { SearchState } from './observables';
import classes from './SizeSlider.module.css';

interface SizeSliderProps {
	state$: SearchState;
}

const SizeSlider = observer(({ state$ }: SizeSliderProps) => {
	const size = state$.size.get();

	return (
		<Grid
			grow
			gutter={0}
			align="center"
			className={classes.wrapper}
			classNames={{ inner: classes.inner }}
		>
			<Grid.Col span={1} className={classes.col}>
				<Text>{size} px</Text>
			</Grid.Col>
			<Grid.Col span={9} className={classes.col}>
				<MantineSlider
					classNames={{ bar: classes.bar }}
					color="purple.0"
					size="sm"
					thumbLabel="Change font size"
					label={null}
					value={size}
					onChange={state$.size.set}
				/>
			</Grid.Col>
		</Grid>
	);
});

export { SizeSlider };
