import {
	Box,
	Checkbox,
	createStyles,
	Divider,
	Flex,
	Group,
	rem,
	Text,
} from '@mantine/core';
import { useAtom } from 'jotai';

import type { Metadata, VariableData } from '@/utils/types';

import { IconEye, IconHorizontal, IconVertical } from '../icons';
import { colorAtom, letterSpacingAtom, lineHeightAtom, transparencyAtom } from './atoms';
import { ColorButton, SliderButton } from './Buttons';
import { LanguageSelector } from './Language';
import { SizeSlider } from './SizeSlider';

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		flexDirection: 'column',
		width: rem(332),
		height: '50vh',
		padding: rem(24),
		border: `1px solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',
	},

	title: {
		fontSize: theme.fontSizes.sm,
		fontWeight: 700,
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		lineHeight: rem(18),
	},
}));

interface ConfigureProps {
	metadata: Metadata;
	variable: VariableData;
}

const Configure = ({ metadata, variable }: ConfigureProps) => {
	const { classes } = useStyles();
	const [lineHeight, setLineHeight] = useAtom(lineHeightAtom);
	const [letterSpacing, setLetterSpacing] = useAtom(letterSpacingAtom);
	const [color, setColor] = useAtom(colorAtom);
	const [transparency, setTransparency] = useAtom(transparencyAtom);

	return (
		<Flex gap="xs" className={classes.wrapper}>
			<Text className={classes.title}>Settings</Text>
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
				<ColorButton label={''} value={color} setValue={setColor}  />
				<SliderButton
					label="Transparency"
					icon={<IconEye />}
					value={transparency}
					setValue={setTransparency}
					suffix="%"
				/>
			</Group>
			{metadata.variable && (
				<>
					<Divider />
					<Text className={classes.title}>
						Variable Axes {JSON.stringify(variable)}
					</Text>
					{Object.keys(variable).map((key) => (
						<Box key={key}>{key}</Box>
					))}
				</>
			)}
			<Checkbox label="Apply to all variants" />
		</Flex>
	);
};

export { Configure };
