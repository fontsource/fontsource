import { useSelector } from '@legendapp/state/react';
import { Grid, Slider as MantineSlider, Text } from '@mantine/core';

import { size } from './observables';
import classes from './SizeSlider.module.css';

const SizeSlider = () => {
	const sizeSelect = useSelector(size);

	return (
		<Grid
			grow
			gutter={0}
			align="center"
			className={classes.wrapper}
			classNames={{ inner: classes.inner }}
		>
			<Grid.Col span={1} className={classes.col}>
				<Text>{size.get()} px</Text>
			</Grid.Col>
			<Grid.Col span={9} className={classes.col}>
				<MantineSlider
					classNames={{ bar: classes.bar }}
					color="purple.0"
					size="sm"
					thumbLabel="Change font size"
					label={undefined}
					value={sizeSelect}
					onChange={size.set}
				/>
			</Grid.Col>
		</Grid>
	);
};

export { SizeSlider };
