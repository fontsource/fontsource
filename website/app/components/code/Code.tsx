import type { CodeProps } from '@mantine/core';
import { createStyles, rem } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Code as MantineCode,
	MantineColor,
	MantineNumberSize,
	MantineTheme,
	ScrollArea,
	Selectors,
	Tooltip,
	useComponentDefaultProps,
	useMantineTheme,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { Highlight } from 'prism-react-renderer';

import { theme } from './theme';

const useStyles = createStyles((theme) => ({
	root: {
		position: 'relative',
	},

	code: {
		boxSizing: 'border-box',
		position: 'relative',
		fontFamily: theme.fontFamilyMonospace,
		lineHeight: 1.7,
		fontSize: rem(14),
		borderRadius: rem(4),
		padding: `${theme.spacing.sm} ${theme.spacing.md}`,
		marginTop: 0,
		marginBottom: 0,
		overflowX: 'hidden',
	},

	line: {
		width: '100%',
	},
}));

export const Code = (props: CodeProps) => {
	const { classes } = useStyles();
	const language = props.className?.replace(/language-/, '') ?? '';
	// Inline code
	if (language == '') return <MantineCode {...props} />;

	const code = props.children?.toString().trim() ?? '';
	return (
		<Box className={classes.root}>
			<Highlight theme={theme} code={code} language={language}>
				{({ style, tokens, getLineProps, getTokenProps }) => (
					<ScrollArea>
						<pre className={classes.code} style={style}>
							{tokens.map((line, i) => (
								<div key={i} {...getLineProps({ line })} className={classes.line}>
									{line.map((token, key) => (
										<span key={key} {...getTokenProps({ token })} />
									))}
								</div>
							))}
						</pre>
					</ScrollArea>
				)}
			</Highlight>
		</Box>
	);
};
