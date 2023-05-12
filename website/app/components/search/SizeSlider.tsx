import {
	createStyles,
	Grid,
	rem,
	Text,
} from '@mantine/core';
import { useAtom } from 'jotai';

import { Slider as MantineSlider} from '@/components/Slider'

import { sizeAtom } from './atoms';

const useStyles = createStyles((theme) => ({
	wrapper: {
		padding: `0 ${rem(24)}`,
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],
		borderBottom: `${rem(1)} solid ${
			theme.colorScheme === 'dark' ? '#2C3651' : '#E1E3EC'
		}`,
		borderRadius: '0 4px 0 0',

		'&:focus-within': {
			borderColor: theme.colors.purple[0],
		},

		[`@media (max-width: ${theme.breakpoints.md})`]: {
			display: 'none',
		},
	},
}));

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
				<Text>{size} px</Text>
			</Grid.Col>
			<Grid.Col span={8}>
				<MantineSlider
					color="purple"
					size="sm"
					label={null}
					value={size}
					onChange={setSize}
					styles={(theme) => ({
						bar: {
							backgroundColor: theme.colors.purple[0],
						},
					})}
				/>
			</Grid.Col>
		</Grid>
	);
};

export { SizeSlider };
