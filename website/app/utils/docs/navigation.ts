import type * as PageTree from 'fumadocs-core/page-tree';
import { findPath, flattenTree } from 'fumadocs-core/page-tree';

interface PageLink {
	name: string;
	url: string;
}

export interface Pager {
	previous?: PageLink;
	next?: PageLink;
}

export interface Breadcrumb {
	name: string;
	url?: string;
}

export const firstInternalPageUrl = (node: PageTree.Folder) =>
	flattenTree([node]).find((page) => !page.external)?.url;

export const getPager = (tree: PageTree.Root, url: string): Pager => {
	const pages = flattenTree(tree.children)
		.filter((page) => !page.external)
		.map((page) => ({ name: String(page.name), url: page.url }));
	const index = pages.findIndex((page) => page.url === url);

	return {
		previous: pages[index - 1],
		next: index >= 0 ? pages[index + 1] : undefined,
	};
};

export const getBreadcrumbs = (
	tree: PageTree.Root,
	url: string,
): Breadcrumb[] =>
	(
		findPath(
			tree.children,
			(node) => node.type === 'page' && node.url === url,
			{ includeSeparator: false },
		) ?? []
	)
		.filter((node) => node.type !== 'separator')
		.map((node) => ({
			name: String(node.name),
			url: node.type === 'folder' ? firstInternalPageUrl(node) : node.url,
		}));
