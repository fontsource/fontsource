import type { CodeProps } from '@mantine/core';
import {
	ActionIcon,
	Box,
	Group,
	Code as MantineCode,
	ScrollArea,
	Text,
	Tooltip,
	useMantineColorScheme,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { Highlight, Prism } from 'prism-react-renderer';
// @ts-expect-error - use isn't officially typed here yet.
import { Suspense, use } from 'react';

import { IconCopy } from '@/components/icons';

import classes from './Code.module.css';
import { themeDark, themeLight } from './theme';

interface CodeWrapperProps {
	children: React.ReactNode;
	language: string;
	code: string;
}

export const CodeWrapper = ({ children, language, code }: CodeWrapperProps) => {
	const clipboard = useClipboard();

	const copyLabel = 'Copy code';
	const copiedLabel = 'Copied';

	return (
		<Box className={classes.root} translate="no">
			<Text className={classes.dots}>&#11044;&#11044;</Text>
			{children}
			<Group gap={0} className={classes.tools}>
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
const extraLanguages = Promise.all([
	// @ts-expect-error - No types for prism themes
	import('prismjs/components/prism-scss'),
	// @ts-expect-error - No types for prism themes
	import('prismjs/components/prism-json'),
	// @ts-expect-error - No types for prism themes
	import('prismjs/components/prism-bash'),
]);

export const CodeHighlight = ({ code, language }: CodeHighlightProps) => {
	use(extraLanguages);
	const { colorScheme } = useMantineColorScheme();

	return (
		<Highlight
			prism={Prism}
			theme={colorScheme === 'dark' ? themeDark : themeLight}
			code={code}
			language={language === 'sh' ? 'bash' : language}
		>
			{({ style, tokens, getLineProps, getTokenProps }) => (
				<pre className={classes.code} style={style}>
					<ScrollArea
						type="auto"
						offsetScrollbars
						className={classes['scroll-area']}
					>
						{tokens.map((line, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: It's the official way to do it
							<div key={i} {...getLineProps({ line })} className={classes.line}>
								{line.map((token, key) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: It's the official way to do it
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
	const language = props.className?.replace(/language-/, '') ?? '';

	// Inline code
	if (language === '')
		return <MantineCode className={classes['inline-code']} {...props} />;

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
	// Inline code
	if (language === '')
		return (
			<MantineCode className={classes['inline-code']} {...others}>
				{children}
			</MantineCode>
		);

	return (
		<CodeWrapper language={language} code={children?.toString() ?? ''}>
			<Suspense fallback={undefined}>
				<CodeHighlight code={children?.toString() ?? ''} language={language} />
			</Suspense>
		</CodeWrapper>
	);
};
