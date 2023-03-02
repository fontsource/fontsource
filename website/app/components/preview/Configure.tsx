import {
	ActionIcon,
	Box,
	Checkbox,
	createStyles,
	Divider,
	Text,
} from '@mantine/core';
import { atom, useAtom } from 'jotai';

import type { Metadata, VariableData } from '@/utils/types';

import { IconItalic } from '../icons/Italic';
import { SizeSlider } from './SizeSlider';

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		flexDirection: 'column',
		width: '332px',
		height: '50vh',
		padding: '24px',
		border: `1px solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',
	},

	title: {
		fontSize: '15px',
		fontWeight: 700,
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		lineHeight: '18px',
	},
}));

interface ConfigureProps {
	metadata: Metadata;
	variable: VariableData;
}

const Configure = ({ metadata, variable }: ConfigureProps) => {
	const { classes } = useStyles();
	return (
		<Box className={classes.wrapper}>
			<Box>
				<Text className={classes.title}>Settings</Text>
				<Text>Language</Text>
					<SizeSlider />

				<Box>
					<Text>Line Height</Text>
					<Text>Letter Spacing</Text>
				</Box>
				<Box>
					<Text>Colour</Text>
					<Text>Transparency</Text>
				</Box>
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
			</Box>
			<Checkbox label="Apply to all variants" />
		</Box>
	);
};

export { Configure };
