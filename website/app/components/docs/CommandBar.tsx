import { Group, UnstyledButton } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { IconBook2, IconSearch } from '@tabler/icons-react';
import { lazy, Suspense, useState } from 'react';

import classes from './CommandBar.module.css';

type SearchDialogComponent = typeof import('./SearchDialog')['SearchDialog'];

let searchDialogPromise:
	| Promise<{ default: SearchDialogComponent }>
	| undefined;

const loadSearchDialog = () => {
	searchDialogPromise ??= import('./SearchDialog').then((module) => ({
		default: module.SearchDialog,
	}));
	return searchDialogPromise;
};

const SearchDialog = lazy(loadSearchDialog);

export const CommandBar = () => {
	const [searchOpen, setSearchOpen] = useState(false);

	const warmSearchDialog = () => {
		void loadSearchDialog();
	};

	const openSearchDialog = () => {
		warmSearchDialog();
		setSearchOpen(true);
	};

	useHotkeys([['mod+K', openSearchDialog]]);

	return (
		<div className={classes.bar}>
			<div className={classes.inner}>
				<Group className={classes.identity} gap={12} wrap="nowrap">
					<IconBook2 size={22} stroke={1.8} aria-hidden="true" />
					<span>Documentation</span>
				</Group>
				<Group className={classes.actions} justify="flex-end" wrap="nowrap">
					<UnstyledButton
						type="button"
						className={classes.search}
						aria-label="Search documentation"
						aria-keyshortcuts="Control+K Meta+K"
						onFocus={warmSearchDialog}
						onPointerEnter={warmSearchDialog}
						onClick={openSearchDialog}
					>
						<IconSearch size={18} stroke={1.8} aria-hidden="true" />
						<span>Search docs</span>
						<kbd>Ctrl K</kbd>
					</UnstyledButton>
				</Group>
			</div>
			{searchOpen && (
				<Suspense fallback={null}>
					<SearchDialog
						open={searchOpen}
						onClose={() => {
							setSearchOpen(false);
						}}
					/>
				</Suspense>
			)}
		</div>
	);
};
