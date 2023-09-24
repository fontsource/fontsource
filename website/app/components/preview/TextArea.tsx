import { useSelector } from '@legendapp/state/react';
import {
	Box,
	Flex,
	Skeleton,
	Text,
	TextInput,
	useMantineColorScheme,
} from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { useEffect } from 'react';

import { useIsFontLoaded } from '@/hooks/useIsFontLoaded';
import type { Metadata } from '@/utils/types';

import { fontVariation, previewState } from './observables';
import classes from './TextArea.module.css';

interface TagProps {
	weight: number;
	active: boolean;
}
interface TextBoxProps {
	family: string;
	weight: number;
	loaded: boolean;
}

interface TextAreaProps {
	metadata: Metadata;
	variableCssKey?: string;
	previewText: string;
}

const Tag = ({ weight, active }: TagProps) => {
	const weightMap: Record<number, string> = {
		100: 'Thin',
		200: 'Extra Light',
		300: 'Light',
		400: 'Regular',
		500: 'Medium',
		600: 'Semi Bold',
		700: 'Bold',
		800: 'Extra Bold',
		900: 'Black',
	};

	return (
		<>
			<Box
				className={classes.tag}
				style={(theme) => ({
					backgroundColor: active ? theme.colors.purple[0] : 'auto',
					color: active ? theme.colors.text[0] : 'auto',
				})}
			>
				{weightMap[weight]} {weight}
			</Box>
			<Box
				className={classes.horizontal}
				style={(theme) => ({
					borderColor: active ? theme.colors.purple[0] : 'auto',
				})}
			/>
		</>
	);
};

const TextBox = ({ family, weight, loaded }: TextBoxProps) => {
	const { ref, focused } = useFocusWithin();
	const state = useSelector(previewState);
	const variation = useSelector(fontVariation);
	const { colorScheme } = useMantineColorScheme();

	useEffect(() => {
		colorScheme === 'dark'
			? previewState.color.set('#FFFFFF')
			: previewState.color.set('#000000');
	}, [colorScheme]);

	return (
		<>
			<Skeleton visible={loaded}>
				<Box className={classes['text-wrapper']}>
					<TextInput
						variant="unstyled"
						styles={{
							input: {
								fontFamily: `"${family}"`,
								fontWeight: weight,
								fontSize: state.size,
								color: state.color,
								letterSpacing: state.letterSpacing,
								lineHeight: state.lineHeight,
								opacity: state.transparency / 100,
								height: 'auto',
								fontStyle: state.italic ? 'italic' : 'normal',
								fontVariationSettings: variation,
							},
						}}
						value={state.text}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							previewState.text.set(event.currentTarget.value)
						}
						autoComplete="off"
						ref={ref}
					/>
				</Box>
			</Skeleton>
			<Tag weight={weight} active={focused} />
		</>
	);
};

const TextArea = ({ metadata, variableCssKey }: TextAreaProps) => {
	const { id, family, weights, variable } = metadata;

	const variableFamily = `${family} Variable`;
	const isVariable = Boolean(variable);

	const isFontLoaded = useIsFontLoaded(isVariable ? variableFamily : family);

	return (
		<Flex direction="column">
			<Text className={classes.header}>Font Preview</Text>
			{!isVariable &&
				weights.map((weight) => (
					<>
						<link
							key={`link-${weight}`}
							rel="stylesheet"
							href={`https://r2.fontsource.org/css/${id}@latest/index.css`}
						/>
						<TextBox
							key={weight}
							weight={weight}
							family={family}
							loaded={!isFontLoaded}
						/>
					</>
				))}
			{isVariable && (
				<link
					rel="stylesheet"
					href={`https://r2.fontsource.org/css/${id}:vf@latest/${
						variableCssKey ?? 'wght'
					}.css`}
				/>
			)}
			{isVariable &&
				weights.map((weight) => (
					<TextBox
						key={weight}
						weight={weight}
						family={variableFamily}
						loaded={!isFontLoaded}
					/>
				))}
		</Flex>
	);
};

export { TextArea };
