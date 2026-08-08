import Markdown, { type MarkdownToJSX } from 'markdown-to-jsx';
import { Fragment, type ReactNode } from 'react';

const MarkdownTextLink = ({ children }: { children?: ReactNode }) => (
	<span>{children}</span>
);

const overrides: MarkdownToJSX.Options['overrides'] = {
	a: { component: 'a', props: { target: '_blank', rel: 'noreferrer' } },
	h1: { component: 'h3' },
	h2: { component: 'h3' },
	h4: { component: 'h3' },
	h5: { component: 'h3' },
	h6: { component: 'h3' },
	hr: () => null,
	img: () => null,
};

const blockOptions: MarkdownToJSX.Options = {
	disableParsingRawHTML: true,
	enforceAtxHeadings: true,
	forceBlock: true,
	overrides,
	wrapper: Fragment,
};

const inlineOptions: MarkdownToJSX.Options = {
	disableParsingRawHTML: true,
	enforceAtxHeadings: true,
	forceInline: true,
	overrides,
	wrapper: Fragment,
};

const inlineTextOptions: MarkdownToJSX.Options = {
	...inlineOptions,
	overrides: {
		...overrides,
		a: { component: MarkdownTextLink },
	},
};

interface RegistryMarkdownProps {
	inline?: boolean;
	links?: boolean;
	value: string;
}

const RegistryMarkdown = ({
	inline = false,
	links = true,
	value,
}: RegistryMarkdownProps) => {
	const options = inline
		? links
			? inlineOptions
			: inlineTextOptions
		: blockOptions;

	return <Markdown options={options}>{value}</Markdown>;
};

export { RegistryMarkdown };
