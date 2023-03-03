import {
	ActionIcon,
	Checkbox,
	createStyles,
	Divider,
	Flex,
	Group,
	rem,
	Text,
} from '@mantine/core';

import { IconRotate } from '@/components/icons';
import type { Metadata, VariableData } from '@/utils/types';

import { NormalButtonsGroup } from './Buttons';
import { VariableButtonsGroup } from './VariableButtons';

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

	return (
		<Flex gap="xs" className={classes.wrapper}>
			<Text className={classes.title}>Settings</Text>
			<NormalButtonsGroup />
			{metadata.variable && (
				<>
					<Divider />
					<Group position='apart'>
						<Text className={classes.title}>
							Variable Axes
						</Text>
						<ActionIcon>
							<IconRotate />
						</ActionIcon>
					</Group>
					<VariableButtonsGroup variable={variable} />
				</>
			)}
			<Checkbox label="Apply to all variants" />
		</Flex>
	);
};

export { Configure };
