import { observer, useValue } from '@legendapp/state/react';
import {
	Box,
	Flex,
	Text,
	TextInput,
	useComputedColorScheme,
} from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { useEffect } from 'react';

import { Skeleton } from '@/components/Skeleton';
import type { GetFontResponse } from '@/generated/api';
import { useIsFontReady } from '@/hooks/useIsFontLoaded';

import type { FontIDState } from './observables';
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
	metadata: GetFontResponse;
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
	const preview = useValue(state$.preview);
	const variation = useValue(state$.fontVariation);

	const isFontReady = useIsFontReady(family, true, {
		weights: [weight],
		style,
	});

	return (
		<Box className={classes.row} ref={ref}>
			<Box className={classes['text-wrapper']}>
				<Skeleton name="font-preview-row" loading={!isFontReady}>
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
					/>
				</Skeleton>
			</Box>
			<Tag weight={weight} active={focused} />
		</Box>
	);
});

const TextArea = ({
	state$,
	metadata,
	staticCSS,
	variableCSS,
}: TextAreaProps) => {
	const { family, weights, variable } = metadata;
	const isVariable = Boolean(variable);
	const colorScheme = useComputedColorScheme('light');

	const isItal = useValue(state$.preview.italic);
	const style = isItal ? 'italic' : 'normal';

	// biome-ignore lint/correctness/useExhaustiveDependencies: Selective.
	useEffect(() => {
		colorScheme === 'dark'
			? state$.preview.color.set('#FFFFFF')
			: state$.preview.color.set('#000000');
	}, [colorScheme]);

	return (
		<Flex direction="column">
			<Text className={classes.header}>Font Preview</Text>
			{isVariable && variableCSS && (
				<>
					<style
						// biome-ignore lint/security/noDangerouslySetInnerHtml: Safe to use
						dangerouslySetInnerHTML={{
							__html: variableCSS,
						}}
					/>
					{weights.map((weight) => (
						<TextBox
							key={`v-${weight}`}
							state$={state$}
							family={`${family} Variable`}
							weight={weight}
							style={style}
						/>
					))}
				</>
			)}
			{!isVariable && (
				<>
					<style
						// biome-ignore lint/security/noDangerouslySetInnerHtml: Safe to use
						dangerouslySetInnerHTML={{
							__html: staticCSS,
						}}
					/>
					{weights.map((weight) => (
						<TextBox
							key={`s-${weight}`}
							state$={state$}
							family={family}
							weight={weight}
							style={style}
						/>
					))}
				</>
			)}
		</Flex>
	);
};

export { TextArea };
