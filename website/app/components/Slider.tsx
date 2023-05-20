import type { SliderProps } from '@mantine/core';
import { rem } from '@mantine/core';
import { Slider as MantineSlider } from '@mantine/core';

// We need to patch slider styles forcefully because Remix Mantine seems to be missing the styles for the slider component for some odd reason. Can be removed when Mantine v7 is released.
const Slider = (props: SliderProps) => (
	<MantineSlider
		{...props}
		styles={(theme) => ({
			track: {
				'&::before': {
					backgroundColor: 'rgba(98, 91, 248, 0.15)',
				},
			},

			bar: {
				backgroundColor: theme.colors.purple[0],
			},

			thumb: {
				height: rem(16),
				width: rem(16),
				backgroundColor: theme.colors.purple[0],

				border: `${rem(4)} solid white`,

				boxShadow: `0 0 0 ${rem(1)} ${theme.colors.border[0]}`,
			},

			label: {
				position: 'absolute',
				top: rem(-40),
				backgroundColor:
					theme.colorScheme === 'dark'
						? theme.colors.dark[4]
						: theme.colors.gray[9],
				fontSize: theme.fontSizes.xs,
				color: theme.white,
				padding: `calc(${theme.spacing.xs} / 2)`,
				borderRadius: theme.radius.sm,
				whiteSpace: 'nowrap',
				pointerEvents: 'none',
				userSelect: 'none',
				touchAction: 'none',
			},

			dragging: {
				boxShadow: `0 0 0 ${rem(2)} ${theme.colors.border[0]}`,
			},
		})}
	/>
);

export { Slider };
