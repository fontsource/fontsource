import { useSelector } from '@legendapp/state/react';
import {
	Box,
	createStyles,
	Flex,
	rem,
	Skeleton,
	Text,
	TextInput,
	useMantineTheme,
} from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { useEffect } from 'react';

import { useIsFontLoaded } from '@/hooks/useIsFontLoaded';
import type { Metadata } from '@/utils/types';

import { fontVariation, previewState } from './observables';

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

const useStyles = createStyles((theme) => ({
	header: {
		fontWeight: 700,
		fontSize: rem(24),
		lineHeight: rem(30),
		marginBottom: rem(20),
	},

	textWrapper: {
		padding: `${rem(24)} 0 ${rem(10)} 0`,
	},

	horizontal: {
		borderBottom: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		width: '100%',
	},

	tag: {
		fontSize: rem(13),
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0],
		padding: `${rem(4)} ${rem(8)}`,
		borderRadius: '4px 4px 0 0',
		marginLeft: 'auto',
		lineHeight: rem(12),
	},
}));

const Tag = ({ weight, active }: TagProps) => {
	const { classes } = useStyles();

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
				sx={(theme) => ({
					backgroundColor: active ? theme.colors.purple[0] : 'auto',
					color: active ? theme.colors.text[0] : 'auto',
				})}
			>
				{weightMap[weight]} {weight}
			</Box>
			<Box
				className={classes.horizontal}
				sx={(theme) => ({
					borderColor: active ? theme.colors.purple[0] : 'auto',
				})}
			/>
		</>
	);
};

const TextBox = ({ family, weight, loaded }: TextBoxProps) => {
	const { classes } = useStyles();
	const theme = useMantineTheme();
	const { ref, focused } = useFocusWithin();
	const state = useSelector(previewState);
	const variation = useSelector(fontVariation);

	useEffect(() => {
		theme.colorScheme === 'dark'
			? previewState.color.set('#FFFFFF')
			: previewState.color.set('#000000');
	}, [theme.colorScheme]);

	return (
		<>
			<Skeleton visible={loaded}>
				<Box className={classes.textWrapper}>
					<TextInput
						variant="unstyled"
						sx={{
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
	const { classes } = useStyles();
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
