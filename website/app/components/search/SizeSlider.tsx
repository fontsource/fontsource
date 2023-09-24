import { useSelector } from '@legendapp/state/react';
import { Grid, Text } from '@mantine/core';

import { Slider as MantineSlider } from '@/components/Slider';

import { size } from './observables';
import classes from './SizeSlider.module.css';

const SizeSlider = () => {
	const sizeSelect = useSelector(size);

	return (
		<Grid
			grow
			gutter={0}
			justify="center"
			align="center"
			className={classes.wrapper}
		>
			<Grid.Col span={2}>
				<Text>{size.get()} px</Text>
			</Grid.Col>
			<Grid.Col span={8}>
				<MantineSlider
					className={classes.slider}
					color="purple.0"
					size="sm"
					label={undefined}
					value={sizeSelect}
					onChange={size.set}
				/>
			</Grid.Col>
		</Grid>
	);
};

export { SizeSlider };
