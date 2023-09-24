import { useSelector } from '@legendapp/state/react';
import { ActionIcon, Box, Group, Text } from '@mantine/core';

import { IconRotate } from '@/components/icons';
import { Slider } from '@/components/Slider';
import type { AxesData, AxisRegistryAll, VariableData } from '@/utils/types';

import { InfoTooltip } from '../InfoTooltip';
import { previewState, variableState } from './observables';
import classes from './VariableButtons.module.css';

interface VariableButtonGroupProps {
	variable: VariableData;
	axisRegistry?: AxisRegistryAll;
}

interface VariableButtonProps {
	tag: string;
	label: string;
	axes: AxesData;
	description: string;
}

const VariableButton = ({
	tag,
	label,
	axes,
	description,
}: VariableButtonProps) => {
	const variable = useSelector(variableState);

	const handleVariation = (value: number) => {
		// If ital is changed, set italic to true
		if (tag === 'ital' && value > 0) {
			previewState.italic.set(true);
		} else if (tag === 'ital' && value === 0) {
			previewState.italic.set(false);
		}
		variableState.set({ ...variableState.get(), [tag]: value });
	};

	const resetVariation = () => {
		if (tag === 'ital') previewState.italic.set(false);

		variableState.set({ ...variableState.get(), [tag]: undefined });
	};

	return (
		<Box className={classes.button}>
			<Group justify="apart" mb={5}>
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
				value={variable[tag] ?? Number(axes.default)}
			/>
			<Group justify="apart" px={3} mt={8}>
				<Text fz="sm">{axes.min}</Text>
				<Text fz="sm">{axes.max}</Text>
			</Group>
		</Box>
	);
};

const VariableButtonsGroup = ({
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
