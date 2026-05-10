import {
	ActionIcon,
	type CodeProps,
	Group,
	Code as MantineCode,
	Text,
	Tooltip,
} from '@mantine/core';
import {
	CodeHighlight as MantineCodeHighlight,
	CodeHighlightAdapterProvider,
} from '@mantine/code-highlight';
import { useClipboard } from '@mantine/hooks';
import cx from 'clsx';
import {
	Children,
	type ComponentProps,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from 'react';

import { IconCopy } from '@/components/icons';

import classes from './Code.module.css';
import {
	codeHighlightAdapter,
	displayLanguage,
	highlightLanguage,
} from './highlight';

type ElementWithCodeProps = {
	children?: ReactNode;
	className?: string;
};

const getNodeText = (node: ReactNode): string => {
	if (typeof node === 'string' || typeof node === 'number') return String(node);

	if (Array.isArray(node)) return node.map(getNodeText).join('');

	if (isValidElement<ElementWithCodeProps>(node)) {
		return getNodeText(node.props.children);
	}

	return '';
};

const getLanguageFromClassName = (className?: string) =>
	className
		?.split(' ')
		.find((name) => name.startsWith('language-'))
		?.replace('language-', '') ?? '';

const getCodeChild = (children: ReactNode) =>
	Children.toArray(children).find((child) =>
		isValidElement<ElementWithCodeProps>(child),
	) as ReactElement<ElementWithCodeProps> | undefined;

interface CodeWrapperProps {
	children: ReactNode;
	language?: string;
	code: string;
}

export const CodeWrapper = ({ children, language, code }: CodeWrapperProps) => {
	const clipboard = useClipboard({ timeout: 1500 });
	const copyLabel = clipboard.copied ? 'Copied' : 'Copy code';

	return (
		<figure className={classes.root} translate="no">
			<Text component="span" className={classes.dots} aria-hidden="true">
				&#11044;&#11044;
			</Text>
			{children}
			<Group gap={0} className={classes.tools} component="figcaption">
				{language ? (
					<div className={classes.language}>
						<Text component="span" fw={400} fz={13}>
							{displayLanguage(language)}
						</Text>
					</div>
				) : null}
				<Tooltip label={copyLabel} withArrow arrowSize={6} offset={6}>
					<ActionIcon
						className={classes.copy}
						aria-label={copyLabel}
						onClick={() => {
							clipboard.copy(code);
						}}
					>
						<IconCopy aria-hidden="true" stroke="white" />
					</ActionIcon>
				</Tooltip>
			</Group>
		</figure>
	);
};

interface CodeHighlightProps {
	code: string;
	language: string;
}

export const CodeHighlight = ({ code, language }: CodeHighlightProps) => (
	<CodeHighlightAdapterProvider adapter={codeHighlightAdapter}>
		<MantineCodeHighlight
			className={classes.highlight}
			classNames={{
				code: classes['code-inner'],
				pre: classes.code,
				scrollarea: classes.scrollarea,
			}}
			code={code}
			language={highlightLanguage(language)}
			withCopyButton={false}
		/>
	</CodeHighlightAdapterProvider>
);

type CodePreProps = ComponentProps<'pre'> & {
	icon?: string;
};

export const CodePre = ({
	children,
	className,
	icon: _icon,
	...props
}: CodePreProps) => {
	const codeChild = getCodeChild(children);
	const codeChildren = codeChild?.props.children ?? children;
	const language =
		getLanguageFromClassName(codeChild?.props.className) ||
		getLanguageFromClassName(className);
	const code = getNodeText(codeChildren).trimEnd();

	return (
		<CodeWrapper language={highlightLanguage(language)} code={code}>
			<pre {...props} className={cx(classes.code, className)}>
				<code className={cx(classes['code-inner'], codeChild?.props.className)}>
					{codeChildren}
				</code>
			</pre>
		</CodeWrapper>
	);
};

export const CodeMdx = (props: CodeProps) => {
	const language = getLanguageFromClassName(props.className);

	if (language === '')
		return <MantineCode className={classes['inline-code']} {...props} />;

	const code = props.children?.toString().trim() ?? '';

	return (
		<CodeWrapper language={highlightLanguage(language)} code={code}>
			<CodeHighlight code={code} language={language} />
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
		<CodeWrapper language={highlightLanguage(language)} code={code}>
			<CodeHighlight code={code} language={language} />
		</CodeWrapper>
	);
};
