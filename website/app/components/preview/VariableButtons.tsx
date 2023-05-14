import { ActionIcon, Box, createStyles, Group, rem, Text } from '@mantine/core';
import { useAtom } from 'jotai';

import { IconRotate } from '@/components/icons';
import { Slider } from '@/components/Slider';
import type { AxesData, AxisRegistryAll, VariableData } from '@/utils/types';

import { InfoTooltip } from '../InfoTooltip';
import { variableAtom, variationAtom } from './atoms';

interface VariableButtonGroupProps {
	variable: VariableData;
	axisRegistry: AxisRegistryAll;
}

interface VariableButtonProps {
	tag: string;
	label: string;
	axes: AxesData;
	description: string;
}

const useStyles = createStyles((theme) => ({
	button: {
		marginTop: rem(2),
		padding: `${rem(8)} ${rem(12)}`,
		justifyContent: 'space-between',
		height: rem(94),
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

const VariableButton = ({
	tag,
	label,
	axes,
	description,
}: VariableButtonProps) => {
	const { classes } = useStyles();
	const [, setVariation] = useAtom(variationAtom);
	const [variableValue] = useAtom(variableAtom);

	const handleVariationAtom = (value: number) => {
		setVariation({ [tag]: value });
	};
	const resetVariationAtom = () => {
		setVariation({ [tag]: undefined });
	};

	return (
		<Box className={classes.button}>
			<Group position="apart" mb={5}>
				<Group align="center" spacing={2}>
					<Text fz="sm" fw={400}>
						{label} <span>({tag})</span>
					</Text>
					<InfoTooltip label={description} />
				</Group>
				<ActionIcon onClick={resetVariationAtom} variant="transparent" mr={-4}>
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
				value={variableValue[tag] ?? Number(axes.default)}
			/>
			<Group position="apart" px={3} mt={8}>
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
			{Object.keys(variable).map((key) => {
				const label = axisRegistry[key]?.name ?? key;
				const description = axisRegistry[key]?.description ?? key;
				return (
					<VariableButton
						key={key}
						tag={key}
						label={label}
						description={description}
						axes={variable[key]}
					/>
				);
			})}
		</>
	);
};

export { VariableButtonsGroup };
