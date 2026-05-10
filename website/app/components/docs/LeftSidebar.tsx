import { Stack, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import type * as PageTree from 'fumadocs-core/page-tree';
import {
	deserializePageTree,
	type SerializedPageTree,
} from 'fumadocs-core/source/client';
import { useMemo } from 'react';
import { Link, useLocation, useMatches } from 'react-router';

import classes from './LeftSidebar.module.css';

interface LayoutData {
	pageTree: SerializedPageTree;
}

interface LeftSidebarProps {
	tree?: PageTree.Root;
	toggle?: () => void;
}

const usePageTree = (tree?: PageTree.Root) => {
	const matches = useMatches();
	const serialized = matches.find((match) => match.id === 'routes/docs')
		?.data as LayoutData | undefined;

	return useMemo(() => {
		if (tree) return tree;
		if (!serialized?.pageTree) return undefined;
		return deserializePageTree(serialized.pageTree);
	}, [serialized?.pageTree, tree]);
};

const nodeKey = (node: PageTree.Node) =>
	node.$id ??
	(node.type === 'page'
		? node.url
		: `${node.type}-${String(node.name ?? node.type)}`);

const containsCurrentPage = (
	node: PageTree.Node,
	currentPath: string,
): boolean => {
	if (node.type === 'page') return currentPath === node.url;
	if (node.type !== 'folder') return false;

	return node.children.some((child) => containsCurrentPage(child, currentPath));
};

const activeRootFolder = (tree: PageTree.Root, currentPath: string) => {
	return tree.children.find(
		(node): node is PageTree.Folder =>
			node.type === 'folder' && containsCurrentPage(node, currentPath),
	);
};

const firstInternalPageUrl = (node: PageTree.Node): string | undefined => {
	if (node.type === 'page') return node.external ? undefined : node.url;
	if (node.type !== 'folder') return undefined;
	if (node.index && !node.index.external) return node.index.url;

	for (const child of node.children) {
		const url = firstInternalPageUrl(child);
		if (url) return url;
	}
};

const PageLink = ({
	node,
	className,
	active = false,
	iconClassName,
	toggle,
}: {
	node: PageTree.Item;
	className: string;
	active?: boolean;
	iconClassName?: string;
	toggle?: () => void;
}) => {
	const content = (
		<>
			<span>{node.name}</span>
			{node.external && (
				<IconExternalLink className={iconClassName} size={14} stroke={1.8} />
			)}
		</>
	);

	if (node.external) {
		return (
			<a className={className} href={node.url} target="_blank" rel="noreferrer">
				{content}
			</a>
		);
	}

	return (
		<Link
			className={className}
			to={node.url}
			prefetch="render"
			data-active={active}
			aria-current={active ? 'page' : undefined}
			onClick={toggle}
		>
			{content}
		</Link>
	);
};

const SidebarNodes = ({
	nodes,
	currentPath,
	toggle,
}: {
	nodes: PageTree.Node[];
	currentPath: string;
	toggle?: () => void;
}) => (
	<>
		{nodes.map((node) => {
			switch (node.type) {
				case 'separator':
					return (
						<Text
							component="div"
							className={classes.separator}
							key={nodeKey(node)}
						>
							{node.name}
						</Text>
					);
				case 'page':
					return (
						<PageLink
							key={node.$id ?? node.url}
							node={node}
							className={classes.page}
							active={currentPath === node.url}
							toggle={toggle}
						/>
					);
				case 'folder':
					return (
						<Stack className={classes.folder} gap={3} key={nodeKey(node)}>
							<Text component="div" className={classes.folderTitle}>
								{node.name}
							</Text>
							<SidebarNodes
								nodes={node.children}
								currentPath={currentPath}
								toggle={toggle}
							/>
						</Stack>
					);
				default:
					return null;
			}
		})}
	</>
);

const RootSection = ({
	node,
	currentPath,
	toggle,
}: {
	node: PageTree.Node;
	currentPath: string;
	toggle?: () => void;
}) => {
	switch (node.type) {
		case 'page':
			return (
				<PageLink
					node={node}
					className={classes.rootSection}
					active={currentPath === node.url}
					iconClassName={classes.rootSectionIcon}
					toggle={toggle}
				/>
			);
		case 'folder': {
			const url = firstInternalPageUrl(node);
			if (!url) return null;

			const active = containsCurrentPage(node, currentPath);

			return (
				<Link
					className={classes.rootSection}
					to={url}
					prefetch="render"
					data-active={active}
					aria-current={active ? 'location' : undefined}
					onClick={toggle}
				>
					<span>{node.name}</span>
				</Link>
			);
		}
		default:
			return null;
	}
};

const LeftSidebar = ({ tree, toggle }: LeftSidebarProps) => {
	const pageTree = usePageTree(tree);
	const location = useLocation();

	if (!pageTree) return null;

	const activeFolder = activeRootFolder(pageTree, location.pathname);

	return (
		<nav className={classes.wrapper} aria-label="Documentation">
			<Stack className={classes.rootSections} gap={1}>
				{pageTree.children.map((node) => (
					<RootSection
						key={nodeKey(node)}
						node={node}
						currentPath={location.pathname}
						toggle={toggle}
					/>
				))}
			</Stack>
			{activeFolder && (
				<Stack className={classes.activeSection} gap={3}>
					<SidebarNodes
						nodes={activeFolder.children}
						currentPath={location.pathname}
						toggle={toggle}
					/>
				</Stack>
			)}
		</nav>
	);
};

export { LeftSidebar };
