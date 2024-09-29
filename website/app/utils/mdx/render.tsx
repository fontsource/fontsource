import { htmlToJsx } from 'html-to-jsx-transform';
import type { Node, Parent, Root, RootContent } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import React, {
	cloneElement,
	type ComponentType,
	createElement,
	Fragment,
	type ReactNode,
} from 'react';

import { mdxComponents, nativeComponentMap } from './getMdxComponent';

export type MDXContent = RootContent | Root;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ComponentMap = Record<string, ComponentType<any>>;

export function MdxRenderer({ mdast }: { mdast: MDXContent }) {
	return mdastToJsx(mdast, mdxComponents);
}

const mdastToJsx = <T extends ComponentMap>(
	mdast: MDXContent,
	customComponents: T,
): [ReactNode, { message: string }[]] => {
	const errors: { message: string }[] = [];
	const components = {
		...nativeComponentMap,
		...customComponents,
	};

	function mapMdastChildren(node: MDXContent): ReactNode {
		// @ts-expect-error
		const res = node.children
			?.flatMap((child: MDXContent) => mdastTransformer(child))
			.filter(Boolean);

		if (Array.isArray(res)) {
			if (!res.length) return null;
			if (res.length === 1) return res[0];

			return res.map((x, i) =>
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				React.isValidElement(x) ? cloneElement(x, { key: i }) : x,
			);
		}

		return res || null;
	}

	function mapJsxChildren(node: MDXContent): ReactNode {
		// @ts-expect-error
		const res = node.children
			?.flatMap((child: MDXContent) => jsxTransformer(child))
			.filter(Boolean);

		if (Array.isArray(res)) {
			if (!res.length) return null;
			if (res.length === 1) return res[0];

			return res.map((x, i) =>
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				React.isValidElement(x) ? cloneElement(x, { key: i }) : x,
			);
		}

		return res || null;
	}

	function jsxTransformer(node: MDXContent): ReactNode {
		if (!node) return [];

		switch (node.type) {
			case 'mdxJsxTextElement':
			case 'mdxJsxFlowElement': {
				if (!node.name) return [];

				const Component = components[node.name];

				if (!Component) {
					errors.push({
						message: `Unsupported jsx component ${node.name}`,
					});
					return null;
				}

				const attrsList = getJsxAttrs(node, (err) => {
					errors.push(err);
				});

				const attrs = Object.fromEntries(attrsList);
				return createElement(Component, attrs, mapJsxChildren(node));
			}
			default: {
				return mdastTransformer(node);
			}
		}
	}

	function mdastTransformer(node: MDXContent): ReactNode {
		if (!node) return [];

		switch (node.type) {
			case 'mdxjsEsm':
			case 'mdxFlowExpression':
			case 'mdxTextExpression':
			case 'yaml':
				return [];
			case 'heading': {
				const Tag = components[`h${node.depth}`] || `h${node.depth}`;
				return createElement(Tag, null, mapMdastChildren(node));
			}
			case 'paragraph':
				return createElement(components.p, null, mapMdastChildren(node));
			case 'blockquote':
				return createElement(
					components.blockquote,
					null,
					mapMdastChildren(node),
				);
			case 'thematicBreak':
				return createElement(components.hr);
			case 'code': {
				if (!node.value) return [];
				const code = node.value;
				return createElement(
					components.pre,
					null,
					createElement(components.code, null, code),
				);
			}
			case 'list': {
				const ListComponent = node.ordered ? components.ol : components.ul;
				return createElement(
					ListComponent,
					{ start: node.ordered ? (node.start ?? undefined) : undefined },
					mapMdastChildren(node),
				);
			}
			case 'listItem': {
				// https://github.com/syntax-tree/mdast-util-gfm-task-list-item#syntax-tree
				if (node?.checked != null) {
					return createElement(
						components.li,
						// @ts-expect-error data-checked is a valid attribute
						{ 'data-checked': node.checked },
						mapMdastChildren(node),
					);
				}
				return createElement(components.li, null, mapMdastChildren(node));
			}
			case 'text':
				return node.value || [];
			case 'image': {
				const { url: src, alt, title } = node;
				return createElement(components.img, {
					src: src || '',
					alt: alt || '',
					title: title || '',
				});
			}
			case 'link': {
				const { url: href, title } = node;
				return createElement(
					components.a,
					{ href: href || '', title: title || '' },
					mapMdastChildren(node),
				);
			}
			case 'strong':
				return createElement(components.strong, null, mapMdastChildren(node));
			case 'emphasis':
				return createElement(components.em, null, mapMdastChildren(node));
			case 'delete':
				return createElement(components.del, null, mapMdastChildren(node));
			case 'inlineCode':
				return node.value
					? createElement(components.code, null, node.value)
					: [];
			case 'break':
				return createElement(components.br);
			case 'root':
				return createElement(Fragment, null, mapMdastChildren(node));
			case 'table': {
				const [head, ...body] = React.Children.toArray(mapMdastChildren(node));
				return createElement(
					components.table,
					null,
					head && createElement(components.thead, null, head),
					!!body?.length && createElement(components.tbody, null, body),
				);
			}
			case 'tableRow':
				return createElement(
					components.tr,
					{ className: '' },
					mapMdastChildren(node),
				);
			case 'tableCell': {
				const content = mapMdastChildren(node);
				return createElement(components.td, { className: '' }, content);
			}
			case 'definition':
			case 'footnoteReference':
			case 'footnoteDefinition':
				return [];
			case 'linkReference': {
				let href = '';
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				mdastBfs(mdast, (child: any) => {
					if (
						child.type === 'definition' &&
						child.identifier === node.identifier
					) {
						href = child.url;
					}
				});
				return createElement(components.a, { href }, mapMdastChildren(node));
			}
			case 'html': {
				try {
					const result = jsxTransformer(node);
					if (Array.isArray(result)) {
						console.log(`Unexpected array result: ${result}`);
					} else if (result) {
						return result;
					}
				} catch (error) {
					console.error('Error transforming HTML to JSX:', error);
				}
				return [];
			}
			case 'imageReference':
				return [];

			default: {
				mdastBfs(node, (node) => {
					node.position = undefined;
				});
				throw new Error(`cannot convert node ${JSON.stringify(node, null, 2)}`);
			}
		}
	}

	const result = mdastTransformer(mdast);
	return [result, errors];
};

function getJsxAttrs(
	node: MdxJsxFlowElement | MdxJsxTextElement,
	onError: (err: { message: string }) => void = console.error,
): [string, unknown][] {
	return node.attributes
		.map((attr): [string, unknown] | undefined => {
			if (attr.type === 'mdxJsxExpressionAttribute') {
				onError({
					message: `Expressions in jsx props are not supported (${attr.value.replace(/\n+/g, ' ')})`,
				});
				return undefined;
			}
			if (attr.type !== 'mdxJsxAttribute') {
				throw new Error(
					`non mdxJsxAttribute is not supported: ${JSON.stringify(attr)}`,
				);
			}

			const v = attr.value;
			if (typeof v === 'string' || typeof v === 'number') {
				return [attr.name, v];
			}
			if (v === null) {
				return [attr.name, true];
			}
			if (v?.type === 'mdxJsxAttributeValueExpression') {
				if (v.value === 'true') return [attr.name, true];
				if (v.value === 'false') return [attr.name, false];
				if (v.value === 'null') return [attr.name, null];
				if (v.value === 'undefined') return [attr.name, undefined];

				const quote = ['"', "'", '`'].find(
					(q) => v.value.startsWith(q) && v.value.endsWith(q),
				);
				if (quote) {
					let value = v.value;
					if (quote !== '"') {
						value = v.value.replace(new RegExp(quote, 'g'), '"');
					}
					return [attr.name, JSON.parse(value)];
				}

				const number = Number(v.value);
				if (!Number.isNaN(number)) {
					return [attr.name, number];
				}
				const parsedJson = safeJsonParse(v.value);
				if (parsedJson) {
					return [attr.name, parsedJson];
				}

				onError({
					message: `Expressions in jsx props are not supported (${attr.name}={${v.value}})`,
				});
			} else {
				console.log('unhandled attr', { attr }, attr.type);
			}

			return undefined;
		})
		.filter((x): x is [string, unknown] => x !== undefined);
}

export function mdastBfs(
	node: Parent | Node,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	cb?: (node: Node | Parent) => any,
) {
	const queue = [node];
	const result: RootContent[] = [];
	while (queue.length) {
		const node = queue.shift();
		const r = cb && node ? cb(node) : node;
		if (Array.isArray(r)) {
			queue.push(...r);
		} else if (r) {
			result.push(r);
		}
		if (node && 'children' in node && node.children) {
			queue.push(...node.children);
		}
	}
	return result;
}

function safeJsonParse(str: string): unknown {
	try {
		return JSON.parse(str);
	} catch (err) {
		return null;
	}
}

const fetchMdx = async (
	slug: string,
	req: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<string | undefined> => {
	const { ASSETS, DOCS } = env;
	// If we're in production, we can just get the doc from the KV cache.
	if (process.env.NODE_ENV === 'production') {
		const result = await DOCS.get(slug);
		if (result) return result;
	}

	// If the doc doesn't exist in the KV, we need to create it.
	const url = new URL(req.url);
	url.pathname = `/docs/${slug}.mdx`;
	const sourceResp = await ASSETS.fetch(url.toString());
	if (!sourceResp.ok) {
		return;
	}

	const source = await sourceResp.text();
	if (!source) return;

	if (process.env.NODE_ENV === 'production') {
		ctx.waitUntil(
			DOCS.put(slug, source, {
				expirationTtl: 60 * 60 * 24 * 7, // 1 week
			}),
		);
	}

	return source;
};

export { fetchMdx };
