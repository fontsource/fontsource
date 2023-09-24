import type { SliderProps } from '@mantine/core';
import { Slider as MantineSlider } from '@mantine/core';

// We need to patch slider styles forcefully because Remix Mantine seems to be missing the styles for the slider component for some odd reason. Can be removed when Mantine v7 is released.
// @ts-expect-error - Mantine v7 prop typings
const Slider = (props: SliderProps) => <MantineSlider {...props} />;

export { Slider };
