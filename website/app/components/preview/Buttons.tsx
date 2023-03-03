import {
	Button,
	clsx,
	ColorInput,
	createStyles,
	Group,
	Popover,
	rem,
	Slider as MantineSlider,
	Text,
	Tooltip,
} from '@mantine/core';

interface SliderButtonProps {
	label: string;
	icon: React.ReactNode;
	value: any;
	setValue: (value: React.SetStateAction<any>) => void;
	suffix?: string;
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

const ColorButton = ({ value, setValue }: SliderButtonProps) => {
	const { classes } = useStyles();

	return (
		<ColorInput
			className={clsx(classes.button, classes.colorButton)}
			variant="unstyled"
			value={value}
			onChange={setValue}
		/>
	);
};

export { ColorButton, SliderButton };
