/* eslint-disable unicorn/prefer-module */
import type { CodeProps } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Code as MantineCode,
	createStyles,
	Group,
	rem,
	ScrollArea,
	Text,
	Tooltip,
	useMantineTheme,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { Highlight, Prism } from 'prism-react-renderer';

import { IconCopy } from '@/components/icons';

import { themeDark, themeLight } from './theme';

const useStyles = createStyles((theme) => ({
	root: {
		position: 'relative',
		margin: `${rem(16)} 0`,
	},

	dots: {
		color: '#34435C',
		position: 'absolute',
		top: rem(8),
		left: rem(14),
		zIndex: 2,
		fontSize: rem(12),
		letterSpacing: rem(2),
		userSelect: 'none',
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
		userSelect: 'none',
	},

	code: {
		boxSizing: 'border-box',
		position: 'relative',
		fontFamily: theme.fontFamilyMonospace,
		lineHeight: 1.7,
		fontSize: rem(14),
		borderRadius: rem(10),
		padding: `${rem(34)} ${theme.spacing.md} ${theme.spacing.md} ${
			theme.spacing.md
		}`,
		marginTop: 0,
		marginBottom: 0,
		overflowX: 'hidden',
	},

	line: {
		width: '100%',
	},

	inlineCode: {
		fontWeight: 500,
		fontSize: rem(13),
		borderRadius: rem(4),
	},
}));

interface CodeWrapperProps {
	children: React.ReactNode;
	language: string;
	code: string;
}

export const CodeWrapper = ({ children, language, code }: CodeWrapperProps) => {
	const { classes } = useStyles();
	const clipboard = useClipboard();

	const copyLabel = 'Copy code';
	const copiedLabel = 'Copied';

	return (
		<Box className={classes.root}>
			<Text className={classes.dots}>&#11044;&#11044;</Text>
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
						onClick={() => {
							clipboard.copy(code);
						}}
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

// Add support for additional languagaes
(typeof global === 'undefined' ? window : global).Prism = Prism;
require('prismjs/components/prism-scss');
require('prismjs/components/prism-json');
require('prismjs/components/prism-bash');

export const CodeHighlight = ({ code, language }: CodeHighlightProps) => {
	const theme = useMantineTheme();
	const { classes } = useStyles();

	return (
		<Highlight
			prism={Prism}
			theme={theme.colorScheme === 'dark' ? themeDark : themeLight}
			code={code}
			language={language === 'sh' ? 'bash' : language}
		>
			{({ style, tokens, getLineProps, getTokenProps }) => (
				<pre className={classes.code} style={style}>
					<ScrollArea
						type="auto"
						offsetScrollbars
						styles={{
							scrollbar: {
								'&:hover': {
									backgroundColor: 'transparent',
									'.___ref-thumb': {
										backgroundColor: '#C2BFFF',
									},
								},
							},

							thumb: {
								backgroundColor: theme.fn.darken('#C2BFFF', 0.2),
							},
						}}
					>
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

export const CodeMdx = (props: CodeProps) => {
	const { classes } = useStyles();
	const language = props.className?.replace(/language-/, '') ?? '';
	// Inline code
	if (language === '')
		return <MantineCode className={classes.inlineCode} {...props} />;

	const code = props.children?.toString().trim() ?? '';

	return (
		<CodeWrapper language={language} code={code}>
			<CodeHighlight code={code} language={language} />
		</CodeWrapper>
	);
};

interface CodeDirectProps extends CodeProps {
	language: string;
}

export const Code = ({ language, children, ...others }: CodeDirectProps) => {
	const { classes } = useStyles();
	// Inline code
	if (language === '')
		return (
			<MantineCode
				className={classes.inlineCode}
				children={children}
				{...others}
			/>
		);

	return (
		<CodeWrapper language={language} code={children?.toString() ?? ''}>
			<CodeHighlight code={children?.toString() ?? ''} language={language} />
		</CodeWrapper>
	);
};
