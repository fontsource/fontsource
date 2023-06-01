import {
	ActionIcon,
	createStyles,
	Divider,
	Flex,
	Group,
	rem,
	ScrollArea,
	Text,
} from '@mantine/core';

import { IconRotate } from '@/components/icons';
import type { AxisRegistryAll, Metadata, VariableData } from '@/utils/types';

import { CarbonAd } from '../CarbonAd';
import { NormalButtonsGroup } from './Buttons';
import { previewState, variableState } from './observables';
import { VariableButtonsGroup } from './VariableButtons';

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		flexDirection: 'column',
		width: rem(332),
		padding: rem(24),
		marginLeft: 'auto',
	},

	scrollWrapper: {
		border: `1px solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',
		width: rem(332),
		marginLeft: 'auto',
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
	axisRegistry?: AxisRegistryAll;
}

const Configure = ({ metadata, variable, axisRegistry }: ConfigureProps) => {
	const { classes } = useStyles();
	const resetVariation = () => {
		previewState.italic.set(false);
		variableState.set({});
	};

	return (
		<>
			<ScrollArea.Autosize mah="50vh" className={classes.scrollWrapper}>
				<Flex gap="xs" className={classes.wrapper}>
					<Text className={classes.title} mb={4}>
						Settings
					</Text>
					<NormalButtonsGroup
						subsets={metadata.subsets}
						hasItalic={metadata.styles.includes('italic')}
					/>
					{metadata.variable && (
						<>
							<Divider mt="sm" />
							<Group position="apart">
								<Text className={classes.title}>Variable Axes</Text>
								<ActionIcon onClick={resetVariation}>
									<IconRotate />
								</ActionIcon>
							</Group>
							<VariableButtonsGroup
								variable={variable}
								axisRegistry={axisRegistry}
							/>
						</>
					)}
				</Flex>
			</ScrollArea.Autosize>
			<CarbonAd w={332} />
		</>
	);
};

export { Configure };
