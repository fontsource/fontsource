import { observer, useValue } from '@legendapp/state/react';
import {
	Button,
	ColorInput,
	Group,
	Slider as MantineSlider,
	Popover,
	Text,
	Tooltip,
} from '@mantine/core';

import { IconEye, IconHorizontal, IconVertical } from '../icons';
import classes from './Buttons.module.css';
import { LanguageSelector } from './Language';
import type { FontIDState } from './observables';
import { SizeSlider } from './SizeSlider';

interface ButtonsProps {
	state$: FontIDState;
	subsets: string[];
	hasItalic: boolean;
	fontId: string;
}

const COLOR_REGEX = /^#[\dA-Fa-f]{0,6}$/;

interface SliderButtonProps {
	label: string;
	icon: React.ReactNode;
	// biome-ignore lint/suspicious/noExplicitAny: Selective.
	value: any;
	// biome-ignore lint/suspicious/noExplicitAny: Selective.
	setValue: (value: React.SetStateAction<any>) => void;
	suffix?: string;
	defaultValue?: number;
	min?: number;
	max?: number;
}

export const SliderButton = ({
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
	({ state$, subsets, hasItalic, fontId }: ButtonsProps) => {
		const lineHeight = useValue(state$.preview.lineHeight);
		const letterSpacing = useValue(state$.preview.letterSpacing);
		const color = useValue(state$.preview.color);
		const transparency = useValue(state$.preview.transparency);

		return (
			<>
				<LanguageSelector state$={state$} subsets={subsets} fontId={fontId} />
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
						onChange={(value) => {
							if (COLOR_REGEX.test(value)) {
								state$.preview.color.set(value);
							}
						}}
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

export { NormalButtonsGroup };
