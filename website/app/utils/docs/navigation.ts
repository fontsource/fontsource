import type * as PageTree from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

export interface PageLink {
	name: string;
	url: string;
	external?: boolean;
}

export interface Pager {
	previous?: PageLink;
	next?: PageLink;
}

export interface Breadcrumb {
	name: string;
	url?: string;
}

const nodeName = (node: { name?: ReactNode }) => String(node.name ?? '');

const isPage = (node: PageTree.Node): node is PageTree.Item =>
	node.type === 'page';

const isFolder = (node: PageTree.Node): node is PageTree.Folder =>
	node.type === 'folder';

const firstInternalPageUrl = (node: PageTree.Node): string | undefined => {
	if (isPage(node)) return node.external ? undefined : node.url;
	if (!isFolder(node)) return undefined;

	if (node.index && !node.index.external) return node.index.url;

	for (const child of node.children) {
		const url = firstInternalPageUrl(child);
		if (url) return url;
	}
};

export const flattenPages = (tree: PageTree.Root): PageLink[] => {
	const pages: PageLink[] = [];

	const visit = (nodes: PageTree.Node[]) => {
		for (const node of nodes) {
			if (isPage(node)) {
				pages.push({
					name: nodeName(node),
					url: node.url,
					external: node.external,
				});
				continue;
			}

			if (isFolder(node)) {
				if (node.index) {
					pages.push({
						name: nodeName(node.index),
						url: node.index.url,
						external: node.index.external,
					});
				}
				visit(node.children);
			}
		}
	};

	visit(tree.children);
	return pages;
};

export const getPager = (tree: PageTree.Root, url: string): Pager => {
	const pages = flattenPages(tree).filter((page) => !page.external);
	const index = pages.findIndex((page) => page.url === url);

	return {
		previous: index > 0 ? pages[index - 1] : undefined,
		next: index >= 0 && index < pages.length - 1 ? pages[index + 1] : undefined,
	};
};

export const getBreadcrumbs = (
	tree: PageTree.Root,
	url: string,
): Breadcrumb[] => {
	const path: Breadcrumb[] = [];

	const visit = (nodes: PageTree.Node[], parents: Breadcrumb[]): boolean => {
		for (const node of nodes) {
			if (isPage(node) && node.url === url) {
				path.push(...parents, { name: nodeName(node), url: node.url });
				return true;
			}

			if (isFolder(node)) {
				const folderPath = [
					...parents,
					{ name: nodeName(node), url: firstInternalPageUrl(node) },
				];
				if (node.index?.url === url) {
					path.push(...folderPath, {
						name: nodeName(node.index),
						url: node.index.url,
					});
					return true;
				}
				if (visit(node.children, folderPath)) return true;
			}
		}

		return false;
	};

	visit(tree.children, []);
	return path;
};
