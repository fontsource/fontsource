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
import { type FontIDState } from './observables';
import { VariableButtonsGroup } from './VariableButtons';

interface ConfigureProps {
	state$: FontIDState;
	metadata: Metadata;
	variable?: VariableData;
	axisRegistry?: AxisRegistryAll;
}

const resetVariation = (state$: FontIDState) => {
	// Reset variation to default
	state$.preview.italic.set(false);
	state$.variable.set({});
};

const Configure = ({
	state$,
	metadata,
	variable,
	axisRegistry,
}: ConfigureProps) => {
	return (
		<>
			<ScrollArea.Autosize
				mah="50vh"
				className={classes['scroll-wrapper']}
				style={{
					overflowX: 'hidden',
				}}
				scrollbars="y"
			>
				<Flex gap="xs" className={classes.wrapper}>
					<Text className={classes.title} mb={4}>
						Settings
					</Text>
					<NormalButtonsGroup
						state$={state$}
						subsets={metadata.subsets}
						defSubset={metadata.defSubset}
						hasItalic={metadata.styles.includes('italic')}
					/>
					{variable && (
						<>
							<Divider mt="sm" />
							<Group justify="space-between">
								<Text className={classes.title}>Variable Axes</Text>
								<ActionIcon
									className={classes.button}
									onClick={() => {
										resetVariation(state$);
									}}
								>
									<IconRotate />
								</ActionIcon>
							</Group>
							<VariableButtonsGroup
								state$={state$}
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
