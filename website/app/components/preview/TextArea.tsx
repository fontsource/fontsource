import { useSelector } from '@legendapp/state/react';
import {
	Box,
	Flex,
	Skeleton,
	Text,
	TextInput,
	useComputedColorScheme,
} from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { Fragment, useEffect } from 'react';

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
			<Box className={classes.tag} data-active={active}>
				{weightMap[weight]} {weight}
			</Box>
			<Box className={classes.horizontal} data-active={active} />
		</>
	);
};

const TextBox = ({ family, weight, loaded }: TextBoxProps) => {
	const { ref, focused } = useFocusWithin();
	const state = useSelector(previewState);
	const variation = useSelector(fontVariation);
	const colorScheme = useComputedColorScheme('light');

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
								fontVariationSettings: variation || undefined,
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
					<Fragment key={`s-${weight}`}>
						<link
							rel="stylesheet"
							href={`https://r2.fontsource.org/css/${id}@latest/index.css`}
						/>
						<TextBox weight={weight} family={family} loaded={!isFontLoaded} />
					</Fragment>
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
						key={`v-${weight}`}
						weight={weight}
						family={variableFamily}
						loaded={!isFontLoaded}
					/>
				))}
		</Flex>
	);
};

export { TextArea };
