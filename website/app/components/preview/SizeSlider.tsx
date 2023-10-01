import { useSelector } from '@legendapp/state/react';
import { ActionIcon, Group, Slider as MantineSlider } from '@mantine/core';

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
					w={84}
					noBorder
				/>

				<MantineSlider
					color="purple.0"
					size="sm"
					// eslint-disable-next-line unicorn/no-null
					label={null}
					value={previewState.size.get()}
					onChange={previewState.size.set}
					w={116}
					max={99}
				/>
			</Group>
			<ActionIcon
				className={classes.italic}
				onClick={handleItalic}
				disabled={!hasItalic}
				data-active={state.italic}
			>
				<IconItalic />
			</ActionIcon>
		</Group>
	);
};

export { SizeSlider };
