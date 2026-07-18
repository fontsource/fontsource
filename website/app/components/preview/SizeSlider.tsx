import { batch } from '@legendapp/state';
import { observer, useValue } from '@legendapp/state/react';
import { ActionIcon, Group, Slider as MantineSlider } from '@mantine/core';

import { DropdownSimple } from '@/components/Dropdown';

import { IconItalic } from '../icons/Italic';
import type { FontIDState } from './observables';
import classes from './SizeSlider.module.css';

interface SizeSliderProps {
	state$: FontIDState;
	hasItalic: boolean;
}

const SizeSlider = observer(({ state$, hasItalic }: SizeSliderProps) => {
	const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64];
	const size = useValue(state$.preview.size);
	const italic = useValue(state$.preview.italic);

	const handleItalic = () => {
		batch(() => {
			state$.preview.italic.toggle();
			state$.variable.ital.set(state$.variable.ital.peek() === 1 ? 0 : 1);
		});
	};

	const items = sizes.map((value) => ({
		label: `${value}px`,
		value: String(value),
		isRefined: size === value,
	}));

	const setSize = (size: string) => {
		state$.preview.size.set(Number(size));
	};

	// className={classes.button}
	return (
		<Group justify="apart" gap="xs">
			<Group className={classes.wrapper}>
				<DropdownSimple
					label={`${size} px`}
					items={items}
					refine={setSize}
					w={84}
					noBorder
				/>

				<MantineSlider
					color="purple.0"
					size="sm"
					label={null}
					value={size}
					onChange={state$.preview.size.set}
					w={116}
					max={99}
				/>
			</Group>
			<ActionIcon
				className={classes.italic}
				onClick={handleItalic}
				disabled={!hasItalic}
				data-active={italic}
			>
				<IconItalic />
			</ActionIcon>
		</Group>
	);
});

export { SizeSlider };
