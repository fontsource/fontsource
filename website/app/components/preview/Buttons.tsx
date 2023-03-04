import {
	Button,
	ColorInput,
	createStyles,
	Group,
	Popover,
	rem,
	Slider as MantineSlider,
	Text,
	Tooltip,
} from '@mantine/core';
import { useAtom } from 'jotai';

import { IconEye, IconHorizontal, IconVertical } from '../icons';
import {
	colorAtom,
	letterSpacingAtom,
	lineHeightAtom,
	transparencyAtom,
} from './atoms';
import { LanguageSelector } from './Language';
import { SizeSlider } from './SizeSlider';

interface SliderButtonProps {
	label: string;
	icon: React.ReactNode;
	value: any;
	setValue: (value: React.SetStateAction<any>) => void;
	suffix?: string;
}

interface ColorButtonProps {
	value: any;
	setValue: (value: React.SetStateAction<any>) => void;
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
			backgroundColor: theme.fn.lighten(theme.colors.purple[0], 0.95),
		}),
	},

	colorButton: {
		padding: 0,
	},
}));

const SliderButton = ({
	label,
	icon,
	value,
	setValue,
	suffix,
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
					color="purple"
					size="sm"
					label={null}
					value={value}
					onChange={setValue}
				/>
			</Popover.Dropdown>
		</Popover>
	);
};

const ColorButton = ({ value, setValue }: ColorButtonProps) => {
	const { classes, cx } = useStyles();

	return (
		<ColorInput
			className={cx(classes.button, classes.colorButton)}
			variant="unstyled"
			value={value}
			onChange={setValue}
		/>
	);
};

const NormalButtonsGroup = () => {
	const [lineHeight, setLineHeight] = useAtom(lineHeightAtom);
	const [letterSpacing, setLetterSpacing] = useAtom(letterSpacingAtom);
	const [color, setColor] = useAtom(colorAtom);
	const [transparency, setTransparency] = useAtom(transparencyAtom);

	return (
		<>
			<LanguageSelector />
			<SizeSlider />
			<Group grow>
				<SliderButton
					label="Line Height"
					icon={<IconVertical />}
					value={lineHeight}
					setValue={setLineHeight}
				/>
				<SliderButton
					label="Letter Spacing"
					icon={<IconHorizontal />}
					value={letterSpacing}
					setValue={setLetterSpacing}
				/>
			</Group>
			<Group grow>
				<ColorButton value={color} setValue={setColor} />
				<SliderButton
					label="Transparency"
					icon={<IconEye />}
					value={transparency}
					setValue={setTransparency}
					suffix="%"
				/>
			</Group>
		</>
	);
};

export { ColorButton, NormalButtonsGroup, SliderButton };
