import {
	createStyles,
	Grid,
	Slider as MantineSlider,
} from '@mantine/core';
import { Button, Menu } from '@mantine/core';
import { useAtom } from 'jotai';

import { IconCaret } from '@/components';

import { sizeAtom } from './atoms';

const useStyles = createStyles((theme) => ({
	wrapper: {
		padding: '0px 24px',
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],
		borderBottom: `1px solid ${
			theme.colorScheme === 'dark' ? '#2C3651' : '#E1E3EC'
		}`,
		borderRadius: '0px 4px 0px 0px',

		'&:focus-within': {
			borderColor: theme.colors.purple[0],
		},

		[`@media (max-width: ${theme.breakpoints.md}px)`]: {
			display: 'none',
		},
	},

	button: {
		padding: '2px 16px',
		height: '40px',

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
			backgroundColor: theme.colors.purpleHover[0],
		},
	},
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

	return (
		<Grid
			grow
			gutter={0}
			justify="center"
			align="center"
			className={classes.wrapper}
		>
			<Grid.Col span={2}>
				<Menu shadow="md">
					<Menu.Target>
						<Button
							className={classes.button}
							rightIcon={<IconCaret />}
							styles={{
								inner: {
									justifyContent: 'space-between',
								},
							}}
						>
							{size} px
						</Button>
					</Menu.Target>
					<Menu.Dropdown>
						<ItemButton value={8} setSize={setSize} />
						<ItemButton value={10} setSize={setSize} />
						<ItemButton value={12} setSize={setSize} />
						<ItemButton value={14} setSize={setSize} />
					</Menu.Dropdown>
				</Menu>
			</Grid.Col>
			<Grid.Col span={8}>
				<MantineSlider
					color="purple"
					size="sm"
					label={null}
					value={size}
					onChange={setSize}
				/>
			</Grid.Col>
		</Grid>
	);
};

export { SizeSlider };
