import { ActionIcon, Box, Group,Slider,Switch, Text } from '@mantine/core';

import { IconRotate } from '@/components/icons';
import type { AxesData, VariableData } from '@/utils/types';

interface VariableButtonGroupProps {
	variable: VariableData;
}

interface VariableButtonProps {
	label: string;
	axes: AxesData;
}

const OpticalSelector = () => {

	return (
		<Group position='apart'>
			<Text>Optical Size</Text>
			<Switch />
		</Group>
	)
}

const VariableButton = ({ label, axes }: VariableButtonProps) => {
	return (
		<Box>
			<Group position='apart'>
				<Text>{label}</Text>
				<ActionIcon><IconRotate /></ActionIcon>
			</Group>
			<Slider />
		</Box>
	);
}

const VariableButtonsGroup = ({ variable }: VariableButtonGroupProps) => {
	return (
		<>
			{'opsz' in variable && <OpticalSelector />}
			{Object.keys(variable).map((key) => (
				key !== 'opsz' && <VariableButton key={key} label={key} axes={variable[key]} />
			))}
		</>
	);
};

export { VariableButtonsGroup };
