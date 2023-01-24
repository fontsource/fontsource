import { Box, Checkbox, createStyles, Divider, Text } from '@mantine/core';
import { atom, useAtom } from 'jotai';

import type { Metadata, VariableData } from '@/utils/types';

import { SizeSlider } from './SizeSlider';

const useStyles = createStyles((theme) => ({
	wrapper: {
		width: '332px',
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
				<Text>Settings</Text>
				<Box>
					<SizeSlider />
				</Box>
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
						<Text>Variable Axes {JSON.stringify(variable)}</Text>
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
