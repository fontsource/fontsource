import { ActionIcon, Box, createStyles, Group, rem,Slider,Text } from '@mantine/core';
import { useAtom } from 'jotai';
import { useState } from 'react';

import { IconRotate } from '@/components/icons';
import type { AxesData, VariableData } from '@/utils/types';

import {  variableAtom, variationAtom } from './atoms';

interface VariableButtonGroupProps {
	variable: VariableData;
}

interface VariableButtonProps {
	label: string;
	axes: AxesData;
}

const useStyles = createStyles((theme) => ({
	button: {
		marginTop: rem(2),
		padding: `${rem(8)} ${rem(12)}`,
		justifyContent: 'space-between',
		height: rem(90),
		border: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',

		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],



		'&:not([data-disabled])': theme.fn.hover({
			backgroundColor: theme.fn.lighten(theme.colors.purple[0], 0.95),
		}),
	},
}));

const VariableButton = ({ label, axes }: VariableButtonProps) => {
	const { classes } = useStyles();
	const [_, setVariation] = useAtom(variationAtom);
	const [variableValue] = useAtom(variableAtom);

	const handleVariationAtom = (value: number) => {
		setVariation({ [label]: value });
	};
	const resetVariationAtom = () => {
		setVariation({ [label]: Number(axes.default) });
	}

	return (
		<Box className={classes.button}>
			<Group position="apart" mb={3}>
				<Text>{label}</Text>
				<ActionIcon onClick={resetVariationAtom} variant='transparent' mr={-4}>
					<IconRotate height={16} />
				</ActionIcon>
			</Group>
			<Slider
				defaultValue={Number(axes.default)}
				min={Number(axes.min)}
				max={Number(axes.max)}
				step={Number(axes.step)}
				precision={1}
				onChange={handleVariationAtom}
				value={variableValue[label]}
			/>
			<Group position="apart" px={3} mt={4}>
				<Text>{axes.min}</Text>
				<Text>{axes.max}</Text>
			</Group>
		</Box>
	);
};

const VariableButtonsGroup = ({ variable }: VariableButtonGroupProps) => {
	return (
		<>
			{Object.keys(variable).map((key) => (
				<VariableButton key={key} label={key} axes={variable[key]}  />
			))}
		</>
	);
};

export { VariableButtonsGroup };
