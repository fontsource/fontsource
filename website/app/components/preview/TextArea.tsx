import { Box, createStyles, Flex, rem, Text, TextInput } from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { useAtom } from 'jotai';
import { useState } from 'react';

import type { Metadata } from '@/utils/types';

import { sizeAtom } from './atoms';

interface TagProps {
	weight: number;
	active: boolean;
}
interface TextBoxProps {
	weight: number;
}

interface TextAreaProps {
	metadata: Metadata;
}

const useStyles = createStyles((theme) => ({
	wrapper: {
		padding: `${rem(24)} ${rem(40)} ${rem(24)} ${rem(24)}`,
		width: '100%',
	},

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

const TextBox = ({ weight }: TextBoxProps) => {
	const { classes } = useStyles();
	const { ref, focused } = useFocusWithin();
	const [previewText, setPreviewText] = useState(
		'The quick brown fox jumps over the lazy dog'
	);
	const [size] = useAtom(sizeAtom);

	return (
		<>
			<Box className={classes.textWrapper}>
				<TextInput
					variant="unstyled"
					sx={{ input: { fontWeight: weight, fontSize: size } }}
					value={previewText}
					onChange={(event) => setPreviewText(event.currentTarget.value)}
					autoComplete="off"
					ref={ref}
				/>
			</Box>
			<Tag weight={weight} active={focused} />
		</>
	);
};

const TextArea = ({ metadata }: TextAreaProps) => {
	const { classes } = useStyles();

	return (
		<Flex direction="column" className={classes.wrapper}>
			<Text className={classes.header}>Font Preview</Text>
			{metadata.weights.map((weight) => (
				<TextBox key={weight} weight={weight} />
			))}
		</Flex>
	);
};

export { TextArea };
