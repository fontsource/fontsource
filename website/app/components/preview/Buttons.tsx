import { useSelector } from '@legendapp/state/react';
import {
	Button,
	ColorInput,
	createStyles,
	Group,
	Popover,
	rem,
	Text,
	Tooltip,
} from '@mantine/core';

import { Slider as MantineSlider } from '@/components/Slider';

import { IconEye, IconHorizontal, IconVertical } from '../icons';
import { LanguageSelector } from './Language';
import { previewState } from './observables';
import { SizeSlider } from './SizeSlider';

interface ButtonsProps {
	subsets: string[];
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

const useStyles = createStyles((theme) => ({
	button: {
		padding: `${rem(2)} ${rem(2)}`,
		height: rem(40),
		border: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',

		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],

		fontWeight: 400,

		'&:not([data-disabled])': theme.fn.hover({
			backgroundColor:
				theme.colorScheme === 'dark'
					? theme.fn.darken(theme.colors.background[4], 0.2)
					: theme.fn.lighten(theme.colors.purple[0], 0.95),
		}),
	},

	colorButton: {
		border: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: rem(4),
		paddingLeft: rem(12),
	},
}));

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
	const { classes } = useStyles();

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

const NormalButtonsGroup = ({ subsets, hasItalic }: ButtonsProps) => {
	const { classes } = useStyles();
	const state = useSelector(previewState);

	return (
		<>
			<LanguageSelector subsets={subsets} />
			<SizeSlider hasItalic={hasItalic} />
			<Group grow>
				<SliderButton
					label="Line Height"
					icon={<IconVertical />}
					value={state.lineHeight}
					setValue={previewState.lineHeight.set}
					max={10}
				/>
				<SliderButton
					label="Letter Spacing"
					icon={<IconHorizontal />}
					value={state.letterSpacing}
					setValue={previewState.letterSpacing.set}
					min={-20}
					max={80}
				/>
			</Group>
			<Group grow>
				<ColorInput
					className={classes.colorButton}
					variant="unstyled"
					value={state.color}
					onChange={previewState.color.set}
					withEyeDropper={false}
				/>
				<SliderButton
					label="Transparency"
					icon={<IconEye />}
					value={state.transparency}
					setValue={previewState.transparency.set}
					suffix="%"
				/>
			</Group>
		</>
	);
};

export { NormalButtonsGroup, SliderButton };
