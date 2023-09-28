import { useSelector } from '@legendapp/state/react';
import { ActionIcon, Group, Slider as MantineSlider } from '@mantine/core';
import { clsx } from 'clsx';

import { DropdownSimple } from '@/components/Dropdown';

import { IconItalic } from '../icons/Italic';
import { previewState, variableState } from './observables';
import classes from './SizeSlider.module.css';

interface SizeSliderProps {
	hasItalic: boolean;
}

const SizeSlider = ({ hasItalic }: SizeSliderProps) => {
	const state = useSelector(previewState);
	const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64];

	const handleItalic = () => {
		previewState.italic.set(!state.italic);
		if (variableState.ital.get() === 1) {
			variableState.ital.set(0);
		} else {
			variableState.ital.set(1);
		}
	};

	const items = sizes.map((size) => ({
		label: `${size}px`,
		value: size,
	}));

	// className={classes.button}
	return (
		<Group justify="apart" gap="xs">
			<Group className={classes.wrapper}>
				<DropdownSimple
					label={`${previewState.size.get()} px`}
					currentState={previewState.size.get()}
					items={items}
					selector={previewState.size}
					w={70}
				/>

				<MantineSlider
					color="purple.0"
					size="sm"
					label={undefined}
					value={previewState.size.get()}
					onChange={previewState.size.set}
					className={classes.slider}
				/>
			</Group>
			<ActionIcon
				className={clsx(classes.wrapper, classes.italic)}
				style={(theme) => ({
					backgroundColor: state.italic ? theme.colors.purple[0] : undefined,
				})}
				onClick={handleItalic}
				disabled={!hasItalic}
			>
				<IconItalic />
			</ActionIcon>
		</Group>
	);
};

export { SizeSlider };
