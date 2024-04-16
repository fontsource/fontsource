import '@docsearch/css';

import { type DocSearchModal as DocSearchModalComponent } from '@docsearch/react';
import { Modal, Text, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMounted } from '@mantine/hooks';
import { Link, useNavigate } from '@remix-run/react';
import { lazy, type LazyExoticComponent, useRef } from 'react';

import { ContentHeader } from '@/components/layout/ContentHeader';

import { IconSearch } from '../icons/Search';
import classes from './DocsHeader.module.css';

interface HitProps {
	hit: { url: string };
	children: React.ReactNode;
}

export function Hit({ hit, children }: HitProps) {
	return <Link to={hit.url}>{children}</Link>;
}

const DocSearchModal: LazyExoticComponent<typeof DocSearchModalComponent> =
	lazy(
		async () =>
			// @ts-expect-error allow dynamic import
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
				navigate(itemUrl);
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
				className={classes.wrapper}
			>
				<IconSearch />
				<Text>Search documentation</Text>
			</UnstyledButton>
			<Modal.Root
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
