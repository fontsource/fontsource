import {
	ActionIcon,
	Button,
	clsx,
	createStyles,
	Group,
	Menu,
	Slider as MantineSlider,
} from '@mantine/core';
import { useAtom } from 'jotai';

import { Dropdown } from '@/components';

import { IconItalic } from '../icons/Italic';
import { sizeAtom } from './atoms';

const useStyles = createStyles((theme) => ({
	wrapper: {
		height: '40px',
		padding: '2px 14px',
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],
		border: `1px solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',

		'&:focus-within': {
			borderColor: theme.colors.purple[0],
		},

		[`@media (max-width: ${theme.breakpoints.md})`]: {
			display: 'none',
		},
	},

	button: {
		padding: '2px 2px',
		height: '20px',

		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],

		fontWeight: 400,

		'&:hover': {
			backgroundColor: '#FFF',
		},
	},

	slider: {
		width: '115px',
	},

	italic: {
		width: '40px',
		padding: '0px'
	}
}));

interface ItemButtonProps {
	value: number;
	setSize: (value: React.SetStateAction<number>) => void;
}

const ItemButton = ({ value, setSize }: ItemButtonProps) => {
	return (
		<Menu.Item
			component="button"
			onClick={() => {
				setSize(value);
			}}
		>
			{value}px
		</Menu.Item>
	);
};

const SizeSlider = () => {
	const { classes } = useStyles();
	const [size, setSize] = useAtom(sizeAtom);
	const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64]

	return (
		<Group position="apart" spacing="xs">
			<Group className={classes.wrapper}>
				<Dropdown label={`${size} px`} width={68} className={classes.button}>
					{sizes.map((size) => <ItemButton key={`size-${size}`} value={size} setSize={setSize} />)}
				</Dropdown>
				<MantineSlider
					color="purple"
					size="sm"
					label={null}
					value={size}
					onChange={setSize}
					className={classes.slider}
				/>
			</Group>
			<ActionIcon className={clsx(classes.wrapper, classes.italic)}>
				<IconItalic />
			</ActionIcon>
		</Group>
	);
};

export { SizeSlider };
