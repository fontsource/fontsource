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

const nodeName = (node: { name?: React.ReactNode }) => node.name ?? null;

const nodeKey = (node: PageTree.Node) => {
	if (node.$id) return node.$id;
	if (isPage(node)) return node.url;
	return `${node.type}-${String(node.name ?? node.type)}`;
};

const isPage = (node: PageTree.Node): node is PageTree.Item =>
	node.type === 'page';

const isFolder = (node: PageTree.Node): node is PageTree.Folder =>
	node.type === 'folder';

const isSeparator = (node: PageTree.Node): node is PageTree.Separator =>
	node.type === 'separator';

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

const isActiveUrl = (currentPath: string, url: string) => currentPath === url;

const containsCurrentPath = (
	node: PageTree.Node,
	currentPath: string,
): boolean => {
	if (isPage(node)) return currentPath === node.url;
	if (!isFolder(node)) return false;

	return node.children.some((child) => containsCurrentPath(child, currentPath));
};

const activeRootFolder = (tree: PageTree.Root, currentPath: string) => {
	return tree.children.find(
		(node): node is PageTree.Folder =>
			isFolder(node) && containsCurrentPath(node, currentPath),
	);
};

const firstInternalPageUrl = (node: PageTree.Node): string | undefined => {
	if (isPage(node)) return node.external ? undefined : node.url;
	if (!isFolder(node)) return undefined;

	for (const child of node.children) {
		const url = firstInternalPageUrl(child);
		if (url) return url;
	}
};

const SidebarPage = ({
	node,
	currentPath,
	toggle,
}: {
	node: PageTree.Item;
	currentPath: string;
	toggle?: () => void;
}) => {
	const active = isActiveUrl(currentPath, node.url);
	const external = Boolean(node.external);
	const label = nodeName(node);
	const content = (
		<>
			<span>{label}</span>
			{external && <IconExternalLink size={14} stroke={1.8} />}
		</>
	);

	if (external) {
		return (
			<a
				className={classes.page}
				href={node.url}
				target="_blank"
				rel="noreferrer"
			>
				{content}
			</a>
		);
	}

	return (
		<Link
			className={classes.page}
			to={node.url}
			prefetch="intent"
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
			if (isSeparator(node)) {
				return (
					<Text
						component="div"
						className={classes.separator}
						key={nodeKey(node)}
					>
						{nodeName(node)}
					</Text>
				);
			}

			if (isPage(node)) {
				return (
					<SidebarPage
						key={node.$id ?? node.url}
						node={node}
						currentPath={currentPath}
						toggle={toggle}
					/>
				);
			}

			if (isFolder(node)) {
				return (
					<Stack className={classes.folder} gap={3} key={nodeKey(node)}>
						<Text component="div" className={classes.folderTitle}>
							{nodeName(node)}
						</Text>
						<SidebarNodes
							nodes={node.children}
							currentPath={currentPath}
							toggle={toggle}
						/>
					</Stack>
				);
			}

			return null;
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
	if (isSeparator(node)) return null;

	if (isPage(node)) {
		const active = isActiveUrl(currentPath, node.url);
		const content = (
			<>
				<span>{nodeName(node)}</span>
				{node.external && (
					<IconExternalLink
						className={classes.rootSectionIcon}
						size={14}
						stroke={1.8}
					/>
				)}
			</>
		);

		if (node.external) {
			return (
				<a
					className={classes.rootSection}
					href={node.url}
					target="_blank"
					rel="noreferrer"
				>
					{content}
				</a>
			);
		}

		return (
			<Link
				className={classes.rootSection}
				to={node.url}
				prefetch="intent"
				data-active={active}
				aria-current={active ? 'page' : undefined}
				onClick={toggle}
			>
				{content}
			</Link>
		);
	}

	if (!isFolder(node)) return null;

	const active = containsCurrentPath(node, currentPath);
	const url = firstInternalPageUrl(node);
	if (!url) return null;

	return (
		<Link
			className={classes.rootSection}
			to={url}
			prefetch="intent"
			data-active={active}
			aria-current={active ? 'location' : undefined}
			onClick={toggle}
		>
			<span>{nodeName(node)}</span>
		</Link>
	);
};

const RootSections = ({
	nodes,
	currentPath,
	toggle,
}: {
	nodes: PageTree.Node[];
	currentPath: string;
	toggle?: () => void;
}) => (
	<Stack className={classes.rootSections} gap={1}>
		{nodes.map((node) => (
			<RootSection
				key={nodeKey(node)}
				node={node}
				currentPath={currentPath}
				toggle={toggle}
			/>
		))}
	</Stack>
);

const LeftSidebar = ({ tree, toggle }: LeftSidebarProps) => {
	const pageTree = usePageTree(tree);
	const location = useLocation();

	if (!pageTree) return null;

	const activeFolder = activeRootFolder(pageTree, location.pathname);

	return (
		<nav className={classes.wrapper} aria-label="Documentation">
			<RootSections
				nodes={pageTree.children}
				currentPath={location.pathname}
				toggle={toggle}
			/>
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
