import { observer } from '@legendapp/state/react';
import { Box, Group, Slider as MantineSlider, Text } from '@mantine/core';

import type { SearchState } from './observables';
import classes from './SizeSlider.module.css';

interface SizeSliderProps {
	state$: SearchState;
}

const SizeSlider = observer(({ state$ }: SizeSliderProps) => {
	const size = state$.size.get();

	return (
		<Group className={classes.wrapper} gap={12} visibleFrom="md" wrap="nowrap">
			<Box w={72} miw={0}>
				<Text>{size} px</Text>
			</Box>
			<Box flex={1} miw={0}>
				<MantineSlider
					classNames={{ bar: classes.bar }}
					color="purple.0"
					size="sm"
					thumbLabel="Change font size"
					label={null}
					value={size}
					onChange={state$.size.set}
				/>
			</Box>
		</Group>
	);
});

export { SizeSlider };
