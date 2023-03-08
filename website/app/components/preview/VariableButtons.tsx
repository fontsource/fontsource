import { ActionIcon, Box, Group, Slider, Switch, Text } from '@mantine/core';
import { useAtom } from 'jotai';

import { IconRotate } from '@/components/icons';
import type { AxesData, VariableData } from '@/utils/types';

import { variableAtom, variationAtom } from './atoms';

interface VariableButtonGroupProps {
	variable: VariableData;
	states: Record<keyof VariableData, React.SetStateAction<string>>;
}

interface VariableButtonProps {
	label: string;
	axes: AxesData;
}

const VariableSlider = ({ axes }: VariableButtonProps) => {
	return (
		<Group position="apart">
			<Text>Optical Size {JSON.stringify(axes)}</Text>
			<Switch />
		</Group>
	);
};

const VariableButton = ({ label, axes }: VariableButtonProps) => {
	const [_, setVariation] = useAtom(variationAtom);
	const handleVariationAtom = (value: number) => {
		setVariation({ [label]: value });
	};

	return (
		<Box>
			<Group position="apart">
				<Text>{label}</Text>
				<ActionIcon>
					<IconRotate />
				</ActionIcon>
			</Group>
			<Slider
				defaultValue={Number(axes.default)}
				min={Number(axes.min)}
				max={Number(axes.max)}
				step={Number(axes.step)}
				precision={1}
				onChange={handleVariationAtom}
			/>
		</Box>
	);
};

const VariableButtonsGroup = ({ variable }: VariableButtonGroupProps) => {
	return (
		<>
			{Object.keys(variable).map((key) => (
				<VariableButton key={key} label={key} axes={variable[key]} />
			))}
		</>
	);
};

export { VariableButtonsGroup };
