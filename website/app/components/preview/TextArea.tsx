import {
	Box,
	createStyles,
	Divider,
	Flex,
	Input,
	rem,
	Text,
} from '@mantine/core';
import { useAtom } from 'jotai';

import type { Metadata } from '@/utils/types';

import { sizeAtom } from './atoms';

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
	},

	textWrapper: {
		padding: `${rem(20)} 0`,
	},
}));

const TextBox = ({ weight }: TextBoxProps) => {
	const { classes } = useStyles();
	const [size] = useAtom(sizeAtom);

	return (
		<Box className={classes.textWrapper}>
			<Input
				variant="unstyled"
				sx={{ input: { fontWeight: weight, fontSize: size } }}
				value="The quick brown fox jumps over the lazy dog"
				readOnly
			/>
			<Divider />
		</Box>
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
