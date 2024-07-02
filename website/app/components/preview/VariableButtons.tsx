import { observer } from '@legendapp/state/react';
import { ActionIcon, Box, Group, Slider, Text } from '@mantine/core';

import { IconRotate } from '@/components/icons';
import type { AxesData, AxisRegistryAll, VariableData } from '@/utils/types';

import { InfoTooltip } from '../InfoTooltip';
import type { FontIDState } from './observables';
import classes from './VariableButtons.module.css';

interface VariableButtonGroupProps {
	state$: FontIDState;
	variable: VariableData;
	axisRegistry?: AxisRegistryAll;
}

interface VariableButtonProps {
	state$: FontIDState;
	tag: string;
	label: string;
	axes: AxesData;
	description: string;
}

const VariableButton = observer(
	({ state$, tag, label, axes, description }: VariableButtonProps) => {
		const handleVariation = (value: number) => {
			// If ital is changed, set italic to true
			if (tag === 'ital' && value > 0) {
				state$.preview.italic.set(true);
			} else if (tag === 'ital' && value === 0) {
				state$.preview.italic.set(false);
			}
			state$.variable.assign({ [tag]: value });
		};

		const resetVariation = () => {
			if (tag === 'ital') state$.preview.italic.set(false);
			state$.variable.assign({ [tag]: undefined });
		};

		return (
			<Box className={classes.button}>
				<Group justify="space-between" mb={5}>
					<Group align="center" gap={2}>
						<Text fz="sm" fw={400}>
							{label} <span>({tag})</span>
						</Text>
						<InfoTooltip label={description} />
					</Group>
					<ActionIcon onClick={resetVariation} variant="transparent" mr={-4}>
						<IconRotate height={16} />
					</ActionIcon>
				</Group>
				<Slider
					defaultValue={Number(axes.default)}
					min={Number(axes.min)}
					max={Number(axes.max)}
					step={Number(axes.step)}
					precision={1}
					onChange={handleVariation}
					value={state$.variable.get()[tag] ?? Number(axes.default)}
				/>
				<Group justify="space-between" px={3} mt={8}>
					<Text fz="sm">{axes.min}</Text>
					<Text fz="sm">{axes.max}</Text>
				</Group>
			</Box>
		);
	},
);

const VariableButtonsGroup = ({
	state$,
	variable,
	axisRegistry,
}: VariableButtonGroupProps) => {
	return (
		<>
			{Object.keys(variable.axes).map((key) => {
				const label = axisRegistry?.[key]?.name ?? key;
				const description = axisRegistry?.[key]?.description ?? key;
				return (
					<VariableButton
						state$={state$}
						key={key}
						tag={key}
						label={label}
						description={description}
						axes={variable.axes[key]}
					/>
				);
			})}
		</>
	);
};

export { VariableButtonsGroup };
