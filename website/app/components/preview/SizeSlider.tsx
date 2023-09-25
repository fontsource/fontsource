import { useSelector } from '@legendapp/state/react';
import { ActionIcon, Group } from '@mantine/core';
import { clsx } from 'clsx';

import { Dropdown, DropdownItem } from '@/components/Dropdown';
import { Slider as MantineSlider } from '@/components/Slider';

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

	return (
		<Group justify="apart" gap="xs">
			<Group className={classes.wrapper}>
				<Dropdown
					label={`${previewState.size.get()} px`}
					width={70}
					className={classes.button}
				>
					{sizes.map((size) => (
						<DropdownItem
							key={size}
							value={size}
							setValue={previewState.size.set}
						/>
					))}
				</Dropdown>
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
