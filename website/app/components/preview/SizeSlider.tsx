import { useSelector } from '@legendapp/state/react';
import { ActionIcon, createStyles, Group, rem } from '@mantine/core';

import { Dropdown, DropdownItem } from '@/components';
import { Slider as MantineSlider } from '@/components/Slider';

import { IconItalic } from '../icons/Italic';
import { previewState } from './observables';

interface SizeSliderProps {
	hasItalic: boolean;
}

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

const SizeSlider = ({ hasItalic }: SizeSliderProps) => {
	const { classes, cx } = useStyles();
	const state = useSelector(previewState);
	const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64];

	return (
		<Group position="apart" spacing="xs">
			<Group className={classes.wrapper}>
				<Dropdown label={`${previewState.size.get()} px`} width={70} className={classes.button}>
					{sizes.map((size) => (
						<DropdownItem key={size} value={size} setValue={previewState.size.set} />
					))}
				</Dropdown>
				<MantineSlider
					color="purple"
					size="sm"
					label={null}
					value={previewState.size.get()}
					onChange={previewState.size.set}
					className={classes.slider}
				/>
			</Group>
			<ActionIcon
				className={cx(classes.wrapper, classes.italic)}
				sx={(theme) => ({
					backgroundColor: state.italic
						? theme.fn.lighten(theme.colors.purple[0], 0.95)
						: '#FFF',
				})}
				onClick={() => previewState.italic.set(!state.italic)}
				disabled={!hasItalic}
			>
				<IconItalic />
			</ActionIcon>
		</Group>
	);
};

export { SizeSlider };
