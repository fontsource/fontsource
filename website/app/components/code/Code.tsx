import type { CodeProps } from '@mantine/core';
import { Group } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Code as MantineCode,
	createStyles,
	rem,
	ScrollArea,
	Text,
	Tooltip,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { Highlight } from 'prism-react-renderer';

import { IconCopy } from '@/components/icons';

import { theme } from './theme';

const useStyles = createStyles((theme) => ({
	root: {
		position: 'relative',
	},

	tools: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		zIndex: 2,
	},

	copy: {
		borderRadius: `0 0 ${rem(4)} 0`,
		'&, &:hover': {
			backgroundColor: theme.colors.purple[0],
		},
		height: rem(30),
		width: rem(30),
	},

	language: {
		borderRadius: `${rem(4)} 0 0 0`,
		color: theme.colors.text[0],
		background: 'rgba(104, 118, 141, 0.5)',
		height: rem(30),
		width: rem(30),
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	code: {
		boxSizing: 'border-box',
		position: 'relative',
		fontFamily: theme.fontFamilyMonospace,
		lineHeight: 1.7,
		fontSize: rem(14),
		borderRadius: rem(10),
		padding: `${theme.spacing.sm} ${theme.spacing.md}`,
		marginTop: 0,
		marginBottom: 0,
		overflowX: 'hidden',
	},

	line: {
		width: '100%',
	},
}));

interface CodeWrapperProps {
	children: React.ReactNode;
	language: string;
	code: string;
}

export const CodeWrapper = ({
	children,
	language,
	code,
}: CodeWrapperProps) => {
	const { classes } = useStyles();
	const clipboard = useClipboard();

	const copyLabel = 'Copy code';
	const copiedLabel = 'Copied';

	return (
		<Box className={classes.root}>
			{children}
			<Group spacing={0} className={classes.tools}>
				<Box className={classes.language}>
					<Text fw={400} fz={13}>
						{language}
					</Text>
				</Box>
				<Tooltip
					label={clipboard.copied ? copiedLabel : copyLabel}
					withArrow
					arrowSize={6}
					offset={6}
				>
					<ActionIcon
						className={classes.copy}
						aria-label={clipboard.copied ? copiedLabel : copyLabel}
						onClick={() => clipboard.copy(code)}
					>
						<IconCopy stroke="white" />
					</ActionIcon>
				</Tooltip>
			</Group>
		</Box>
	);
};

interface CodeHighlightProps {
	code: string;
	language: string;
}

export const CodeHighlight = ({ code, language }: CodeHighlightProps) => {
	const { classes } = useStyles();

	return (
		<Highlight theme={theme} code={code} language={language}>
			{({ style, tokens, getLineProps, getTokenProps }) => (
				<pre className={classes.code} style={style}>
					<ScrollArea type="auto" offsetScrollbars>
						{tokens.map((line, i) => (
							<div key={i} {...getLineProps({ line })} className={classes.line}>
								{line.map((token, key) => (
									<span key={key} {...getTokenProps({ token })} />
								))}
							</div>
						))}
					</ScrollArea>
				</pre>
			)}
		</Highlight>
	);
};

export const Code = (props: CodeProps) => {
	const language = props.className?.replace(/language-/, '') ?? '';
	// Inline code
	if (language == '') return <MantineCode {...props} />;

	const code = props.children?.toString().trim() ?? '';

	return (
		<CodeWrapper language={language} code={code}>
			<CodeHighlight code={code} language={language} />
		</CodeWrapper>
	);
};
