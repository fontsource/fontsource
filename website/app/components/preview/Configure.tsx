import {
	ActionIcon,
	Divider,
	Flex,
	Group,
	ScrollArea,
	Text,
} from '@mantine/core';

import { IconRotate } from '@/components/icons';
import type { AxisRegistryAll, Metadata, VariableData } from '@/utils/types';

import { CarbonAd } from '../CarbonAd';
import { NormalButtonsGroup } from './Buttons';
import classes from './Configure.module.css';
import { previewState, variableState } from './observables';
import { VariableButtonsGroup } from './VariableButtons';

interface ConfigureProps {
	metadata: Metadata;
	variable?: VariableData;
	axisRegistry?: AxisRegistryAll;
}

const resetVariation = () => {
	previewState.italic.set(false);
	variableState.set({});
};

const Configure = ({ metadata, variable, axisRegistry }: ConfigureProps) => {
	return (
		<>
			<ScrollArea.Autosize mah="50vh" className={classes['scroll-wrapper']}>
				<Flex gap="xs" className={classes.wrapper}>
					<Text className={classes.title} mb={4}>
						Settings
					</Text>
					<NormalButtonsGroup
						subsets={metadata.subsets}
						hasItalic={metadata.styles.includes('italic')}
					/>
					{variable && (
						<>
							<Divider mt="sm" />
							<Group justify="apart">
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
