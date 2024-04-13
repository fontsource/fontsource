import { observer } from '@legendapp/state/react';
import {
	Button,
	ColorInput,
	Group,
	Popover,
	Slider as MantineSlider,
	Text,
	Tooltip,
} from '@mantine/core';

import { IconEye, IconHorizontal, IconVertical } from '../icons';
import classes from './Buttons.module.css';
import { LanguageSelector } from './Language';
import { type FontIDState } from './observables';
import { SizeSlider } from './SizeSlider';

interface ButtonsProps {
	state$: FontIDState;
	subsets: string[];
	defSubset: string;
	hasItalic: boolean;
}

interface SliderButtonProps {
	label: string;
	icon: React.ReactNode;
	value: any;
	setValue: (value: React.SetStateAction<any>) => void;
	suffix?: string;
	defaultValue?: number;
	min?: number;
	max?: number;
}

const SliderButton = ({
	label,
	icon,
	value,
	setValue,
	suffix,
	defaultValue,
	min,
	max,
}: SliderButtonProps) => {
	return (
		<Popover width={200} position="bottom" withArrow shadow="md">
			<Popover.Target>
				<Tooltip label={label} openDelay={600} closeDelay={100}>
					<Button className={classes.button}>
						<Group>
							{icon}
							<Text>
								{value}
								{suffix}
							</Text>
						</Group>
					</Button>
				</Tooltip>
			</Popover.Target>
			<Popover.Dropdown>
				<MantineSlider
					color="purple.0"
					size="sm"
					// eslint-disable-next-line unicorn/no-null
					label={null}
					value={value}
					onChange={setValue}
					defaultValue={defaultValue}
					min={min}
					max={max}
				/>
			</Popover.Dropdown>
		</Popover>
	);
};

const NormalButtonsGroup = observer(
	({ state$, subsets, hasItalic, defSubset }: ButtonsProps) => {
		const lineHeight = state$.preview.lineHeight.get();
		const letterSpacing = state$.preview.letterSpacing.get();
		const color = state$.preview.color.get();
		const transparency = state$.preview.transparency.get();

		return (
			<>
				<LanguageSelector
					state$={state$}
					subsets={subsets}
					defSubset={defSubset}
				/>
				<SizeSlider state$={state$} hasItalic={hasItalic} />
				<Group grow>
					<SliderButton
						label="Line Height"
						icon={<IconVertical />}
						value={lineHeight}
						setValue={state$.preview.lineHeight.set}
						max={10}
					/>
					<SliderButton
						label="Letter Spacing"
						icon={<IconHorizontal />}
						value={letterSpacing}
						setValue={state$.preview.letterSpacing.set}
						min={-20}
						max={80}
					/>
				</Group>
				<Group grow>
					<ColorInput
						className={classes['color-button']}
						variant="unstyled"
						value={color}
						onChange={state$.preview.color.set}
						withEyeDropper={false}
					/>
					<SliderButton
						label="Transparency"
						icon={<IconEye />}
						value={transparency}
						setValue={state$.preview.transparency.set}
						suffix="%"
					/>
				</Group>
			</>
		);
	},
);

export { NormalButtonsGroup, SliderButton };
