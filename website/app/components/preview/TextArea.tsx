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
import { useEffect } from 'react';

import { useIsFontLoaded } from '@/hooks/useIsFontLoaded';
import { getPreviewText } from '@/utils/language/language';
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
	style: string;
}

interface TextAreaProps {
	metadata: Metadata;
	staticCSS: string;
	variableCSS?: string;
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

const TextBox = ({ family, weight, style }: TextBoxProps) => {
	const { ref, focused } = useFocusWithin();
	const state = useSelector(previewState);
	const variation = useSelector(fontVariation);
	const colorScheme = useComputedColorScheme('light');

	useEffect(() => {
		colorScheme === 'dark'
			? previewState.color.set('#FFFFFF')
			: previewState.color.set('#000000');
	}, [colorScheme]);

	const isFontLoaded = useIsFontLoaded(family, { weights: [weight], style });

	return (
		<>
			<Box className={classes['text-wrapper']}>
				<Skeleton visible={!isFontLoaded}>
					<TextInput
						variant="unstyled"
						className={classes.text}
						styles={{
							input: {
								fontFamily: `"${family}", "Fallback Outline"`,
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
				</Skeleton>
			</Box>
			<Tag weight={weight} active={focused} />
		</>
	);
};

const TextArea = ({ metadata, staticCSS, variableCSS }: TextAreaProps) => {
	const { id, family, weights, variable, defSubset, category } = metadata;
	const isVariable = Boolean(variable);

	const isItal = useSelector(previewState.italic);
	const style = isItal ? 'italic' : 'normal';

	const isNotLatin =
		defSubset !== 'latin' || category === 'icons' || category === 'other';
	useEffect(() => {
		if (isNotLatin) {
			previewState.text.set(getPreviewText(defSubset, id));
		}
	}, [isNotLatin, defSubset, id]);

	return (
		<Flex direction="column">
			<Text className={classes.header}>Font Preview</Text>
			{!isVariable && (
				<style
					dangerouslySetInnerHTML={{
						__html: staticCSS,
					}}
				/>
			)}
			{!isVariable &&
				weights.map((weight) => (
					<TextBox
						key={`s-${weight}-${style}`}
						family={family}
						weight={weight}
						style={style}
					/>
				))}
			{isVariable && variableCSS && (
				<style
					dangerouslySetInnerHTML={{
						__html: variableCSS,
					}}
				/>
			)}
			{isVariable &&
				weights.map((weight) => (
					<TextBox
						key={`v-${weight}-${style}`}
						family={`${family} Variable`}
						weight={weight}
						style={style}
					/>
				))}
		</Flex>
	);
};

export { TextArea };
