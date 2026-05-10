import type { CodeProps } from '@mantine/core';
import { Group, Code as MantineCode, UnstyledButton } from '@mantine/core';
import { IconCopy } from '@tabler/icons-react';
import { useState } from 'react';

import classes from './Code.module.css';

interface CodeWrapperProps {
	children: React.ReactNode;
	language: string;
	code: string;
}

export const CodeWrapper = ({ children, language, code }: CodeWrapperProps) => {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		window.setTimeout(() => {
			setCopied(false);
		}, 1500);
	};

	return (
		<figure className={classes.root} translate="no">
			<Group
				component="figcaption"
				className={classes.header}
				gap={12}
				justify="space-between"
				wrap="nowrap"
			>
				<span>{language || 'text'}</span>
				<UnstyledButton type="button" onClick={copy}>
					<IconCopy size={15} stroke={1.8} />
					{copied ? 'Copied' : 'Copy'}
				</UnstyledButton>
			</Group>
			{children}
		</figure>
	);
};

interface CodeHighlightProps {
	code: string;
}

export const CodeHighlight = ({ code }: CodeHighlightProps) => (
	<pre className={classes.code}>
		<code>{code}</code>
	</pre>
);

export const CodeMdx = (props: CodeProps) => {
	const language = props.className?.replace(/language-/, '') ?? '';

	if (language === '')
		return <MantineCode className={classes['inline-code']} {...props} />;

	const code = props.children?.toString().trim() ?? '';

	return (
		<CodeWrapper language={language} code={code}>
			<CodeHighlight code={code} />
		</CodeWrapper>
	);
};

interface CodeDirectProps extends CodeProps {
	language: string;
}

export const Code = ({ language, children, ...others }: CodeDirectProps) => {
	if (language === '')
		return (
			<MantineCode className={classes['inline-code']} {...others}>
				{children}
			</MantineCode>
		);

	const code = children?.toString() ?? '';

	return (
		<CodeWrapper language={language} code={code}>
			<CodeHighlight code={code} />
		</CodeWrapper>
	);
};
