import '@docsearch/css/dist/style.css';

import type { DocSearchModal as DocSearchModalComponent } from '@docsearch/react';
import { Group, Modal, Text, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMounted } from '@mantine/hooks';
import { type LazyExoticComponent, lazy, useRef } from 'react';
import { Link, useNavigate } from 'react-router';

import { ContentHeader } from '@/components/layout/ContentHeader';

import { IconSearch } from '../icons/Search';
import classes from './DocsHeader.module.css';

interface HitProps {
	hit: { url: string };
	children: React.ReactNode;
}

const Hit = ({ hit, children }: HitProps) => {
	const url = new URL(hit.url);
	// If URL comes from fontsource.org, use the pathname
	// else, become an external link
	if (url.hostname === 'fontsource.org') {
		return <Link to={url.pathname}>{children}</Link>;
	}

	return (
		<a href={hit.url} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	);
};

const DocSearchModal: LazyExoticComponent<typeof DocSearchModalComponent> =
	lazy(
		async () =>
			// @ts-expect-error allow dynamic import with no type declarations
			await import('@docsearch/react/modal').then((mod) => ({
				default: mod.DocSearchModal,
			})),
	);

export const DocsHeader = () => {
	// Prevent SSR hydration error where window is not defined
	const mounted = useMounted();

	const searchButtonRef = useRef<HTMLButtonElement>(null);
	const [searchOpen, { open, close }] = useDisclosure(false, {
		onClose: () => {
			searchButtonRef.current?.focus();
		},
	});

	// Docsearch modal navigation
	const navigate = useNavigate();
	const navigator = useRef({
		navigate({ itemUrl }: { itemUrl?: string }) {
			if (itemUrl) {
				const url = new URL(itemUrl);
				if (url.hostname === 'fontsource.org') {
					navigate(url.pathname);
				} else {
					window.open(itemUrl, '_blank');
				}
			}
		},
	}).current;

	return (
		<ContentHeader>
			<Title order={1} className={classes.title}>
				Documentation
			</Title>
			<UnstyledButton
				ref={searchButtonRef}
				onClick={open}
				className={classes['search-button']}
			>
				<Group>
					<IconSearch />
					<Text>Search documentation</Text>
				</Group>
			</UnstyledButton>
			<Modal.Root
				className={classes.docsearch}
				opened={searchOpen}
				onClose={close}
				centered
				fullScreen
				transitionProps={{ duration: 100 }}
			>
				{mounted && (
					<Modal.Content>
						<Modal.Body>
							<DocSearchModal
								appId="YWR9D3OTR6"
								apiKey="c9e0707b51c2712b86c1725c9ab09237"
								indexName="fontsource"
								placeholder="Search documentation..."
								onClose={close}
								initialScrollY={window.scrollY}
								hitComponent={Hit}
								navigator={navigator}
							/>
						</Modal.Body>
					</Modal.Content>
				)}
			</Modal.Root>
		</ContentHeader>
	);
};
