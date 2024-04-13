import { observer } from '@legendapp/state/react';
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

import { type FontIDState } from './observables';
import classes from './TextArea.module.css';

interface TagProps {
	weight: number;
	active: boolean;
}
interface TextBoxProps {
	state$: FontIDState;
	family: string;
	weight: number;
	style: string;
}

interface TextAreaProps {
	state$: FontIDState;
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

const TextBox = observer(({ state$, family, weight, style }: TextBoxProps) => {
	const { ref, focused } = useFocusWithin();
	const preview = state$.preview.get();
	const variation = state$.fontVariation.get();
	const colorScheme = useComputedColorScheme('light');

	useEffect(() => {
		colorScheme === 'dark'
			? state$.preview.color.set('#FFFFFF')
			: state$.preview.color.set('#000000');
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
								fontSize: preview.size,
								color: preview.color,
								letterSpacing: preview.letterSpacing,
								lineHeight: preview.lineHeight,
								opacity: preview.transparency / 100,
								height: 'auto',
								fontStyle: preview.italic ? 'italic' : 'normal',
								fontVariationSettings: variation || undefined,
							},
						}}
						value={preview.text}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							state$.preview.text.set(event.currentTarget.value)
						}
						autoComplete="off"
						ref={ref}
					/>
				</Skeleton>
			</Box>
			<Tag weight={weight} active={focused} />
		</>
	);
});

const TextArea = ({
	state$,
	metadata,
	staticCSS,
	variableCSS,
}: TextAreaProps) => {
	const { id, family, weights, variable, defSubset, category } = metadata;
	const isVariable = Boolean(variable);

	const isItal = state$.preview.italic.get();
	const style = isItal ? 'italic' : 'normal';

	const isNotLatin =
		defSubset !== 'latin' || category === 'icons' || category === 'other';
	useEffect(() => {
		if (isNotLatin) {
			state$.preview.text.set(getPreviewText(defSubset, id));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
						state$={state$}
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
						state$={state$}
						family={`${family} Variable`}
						weight={weight}
						style={style}
					/>
				))}
		</Flex>
	);
};

export { TextArea };
