import {
	ActionIcon,
	createStyles,
	Group,
	rem,
	Slider as MantineSlider,
} from '@mantine/core';
import { useAtom } from 'jotai';

import { Dropdown, DropdownItem } from '@/components';

import { IconItalic } from '../icons/Italic';
import { italicAtom, sizeAtom } from './atoms';

const useStyles = createStyles((theme) => ({
	wrapper: {
		height: rem(40),
		padding: `${rem(2)} ${rem(14)}`,
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],
		border: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',

		'&:focus-within': {
			borderColor: theme.colors.purple[0],
		},
	},

	button: {
		padding: rem(2),
		height: rem(20),

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
			backgroundColor: '#FFF',
		}),
	},

	slider: {
		width: rem(115),
	},

	italic: {
		width: rem(40),
		padding: 0,
	},
}));

const SizeSlider = () => {
	const { classes, cx } = useStyles();
	const [italic, setItalic] = useAtom(italicAtom);
	const [size, setSize] = useAtom(sizeAtom);
	const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64];

	return (
		<Group position="apart" spacing="xs">
			<Group className={classes.wrapper}>
				<Dropdown label={`${size} px`} width={70} className={classes.button}>
					{sizes.map((size) => (
						<DropdownItem key={size} value={size} setValue={setSize} />
					))}
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
			<ActionIcon
				className={cx(classes.wrapper, classes.italic)}
				sx={(theme) => ({
					backgroundColor: italic
						? theme.fn.lighten(theme.colors.purple[0], 0.95)
						: '#FFF',
				})}
				onClick={() => setItalic(!italic)}
			>
				<IconItalic />
			</ActionIcon>
		</Group>
	);
};

export { SizeSlider };
