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
import { useAtom } from 'jotai';

import { IconRotate } from '@/components/icons';
import type { AxisRegistry, Metadata, VariableData } from '@/utils/types';

import { variationAtom } from './atoms';
import { NormalButtonsGroup } from './Buttons';
import { VariableButtonsGroup } from './VariableButtons';

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		flexDirection: 'column',
		width: rem(332),
		padding: rem(24),
	},

	scrollWrapper: {
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
	axisRegistry: Record<string, AxisRegistry>;
}

const Configure = ({ metadata, variable, axisRegistry }: ConfigureProps) => {
	const { classes } = useStyles();
	const [_, setVariation] = useAtom(variationAtom);
	const resetVariationAtom = () => {
		setVariation({});
	};

	return (
		<ScrollArea.Autosize mah="50vh" className={classes.scrollWrapper}>
			<Flex gap="xs" className={classes.wrapper}>
				<Text className={classes.title}>Settings</Text>
				<NormalButtonsGroup subsets={metadata.subsets} hasItalic={metadata.styles.includes('italic')} />
				{metadata.variable && (
					<>
						<Divider mt="sm" />
						<Group position="apart">
							<Text className={classes.title}>Variable Axes</Text>
							<ActionIcon onClick={resetVariationAtom}>
								<IconRotate />
							</ActionIcon>
						</Group>
						<VariableButtonsGroup variable={variable} axisRegistry={axisRegistry} />
					</>
				)}
			</Flex>
		</ScrollArea.Autosize>
	);
};

export { Configure };
