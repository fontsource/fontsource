import { useValue } from '@legendapp/state/react';
import {
	ActionIcon,
	Button,
	Menu,
	ScrollArea,
	VisuallyHidden,
} from '@mantine/core';
import { IconFolderPlus, IconPlus, IconSettings } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { FontSummary } from '@/utils/font-summary';
import {
	CreateCollectionModal,
	ManageCollectionsModal,
} from './CollectionManager';
import menuClasses from './CollectionMenu.module.css';
import { useCollectionsStore } from './CollectionsProvider';
import { normalizeCollectionName } from './model';

interface CollectionPickerProps {
	fonts: readonly FontSummary[];
	variant: 'font' | 'font-set';
}

const CollectionPicker = ({ fonts, variant }: CollectionPickerProps) => {
	const store = useCollectionsStore();
	const navigate = useNavigate();
	const ready = useValue(store.ready$);
	const collections = useValue(store.getCollections);
	const customCollections = collections.filter(
		(collection) => collection.kind === 'custom',
	);
	const selectableCollections =
		variant === 'font-set' ? collections : customCollections;
	const [query, setQuery] = useState('');
	const normalizedQuery = normalizeCollectionName(query);
	const visibleCollections = normalizedQuery
		? selectableCollections.filter((collection) =>
				normalizeCollectionName(collection.name).includes(normalizedQuery),
			)
		: selectableCollections;
	const [createOpened, setCreateOpened] = useState(false);
	const [manageOpened, setManageOpened] = useState(false);
	const [announcement, setAnnouncement] = useState('');
	const targetRef = useRef<HTMLButtonElement>(null);
	const fontLabel =
		fonts.length === 1 ? fonts[0].family : `${fonts.length} fonts`;
	const label =
		variant === 'font'
			? `Manage collections for ${fontLabel}`
			: `Add all ${fonts.length} fonts to a collection`;
	const restoreFocus = () => {
		if (!createOpened && !manageOpened) targetRef.current?.focus();
	};

	return (
		<>
			<VisuallyHidden role="status">{announcement}</VisuallyHidden>
			<Menu
				classNames={{ dropdown: menuClasses.dropdown }}
				closeOnItemClick={false}
				onClose={() => setQuery('')}
				position="bottom-end"
				shadow="md"
			>
				<Menu.Target>
					{variant === 'font' ? (
						<ActionIcon
							aria-label={label}
							color="purple.0"
							disabled={!ready}
							ref={targetRef}
							size="lg"
							title={label}
							type="button"
							variant="transparent"
						>
							<IconFolderPlus size={20} />
						</ActionIcon>
					) : (
						<Button
							disabled={!ready || fonts.length === 0}
							leftSection={<IconFolderPlus size={17} />}
							ref={targetRef}
							type="button"
							variant="subtle"
						>
							{fonts.length === 1
								? 'Add to collection'
								: 'Add all to collection'}
						</Button>
					)}
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Label>Collections</Menu.Label>
					{selectableCollections.length >= 9 && (
						<Menu.Search
							aria-label="Search collections"
							dir="auto"
							onChange={(event) => setQuery(event.currentTarget.value)}
							placeholder="Search collections"
							value={query}
						/>
					)}
					<VisuallyHidden role="status">
						{normalizedQuery
							? `${visibleCollections.length} matching ${visibleCollections.length === 1 ? 'collection' : 'collections'}.`
							: ''}
					</VisuallyHidden>
					<ScrollArea.Autosize mah={240} type="scroll">
						{visibleCollections.length > 0 ? (
							visibleCollections.map((collection) => {
								const includedCount = fonts.filter((font) =>
									collection.fontIds.includes(font.id),
								).length;
								const allIncluded = includedCount === fonts.length;
								return (
									<Menu.CheckboxItem
										checked={allIncluded}
										key={collection.id}
										onChange={(checked) => {
											if (checked) {
												const added =
													store.addFontsToCollection(collection.id, fonts) ?? 0;
												setAnnouncement(
													`Added ${added} ${added === 1 ? 'font' : 'fonts'} to ${collection.name}.`,
												);
											} else {
												const removed =
													store.removeFontsFromCollection(
														collection.id,
														fonts.map((font) => font.id),
													) ?? 0;
												setAnnouncement(
													`Removed ${removed} ${removed === 1 ? 'font' : 'fonts'} from ${collection.name}.`,
												);
											}
										}}
									>
										<span dir="auto">{collection.name}</span>
										{variant === 'font-set' &&
											includedCount > 0 &&
											!allIncluded &&
											` · ${includedCount} already added`}
									</Menu.CheckboxItem>
								);
							})
						) : (
							<Menu.Label>
								{normalizedQuery
									? 'No matching collections'
									: 'No collections yet'}
							</Menu.Label>
						)}
					</ScrollArea.Autosize>
					<Menu.Divider />
					<Menu.Item
						closeMenuOnClick
						leftSection={<IconPlus size={16} />}
						onClick={() => setCreateOpened(true)}
					>
						New collection…
					</Menu.Item>
					<Menu.Item
						closeMenuOnClick
						leftSection={<IconSettings size={16} />}
						onClick={() => setManageOpened(true)}
					>
						Manage collections…
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>
			<CreateCollectionModal
				fonts={fonts}
				onClose={() => setCreateOpened(false)}
				onCreated={(collectionId) =>
					store.addFontsToCollection(collectionId, fonts)
				}
				onExitTransitionEnd={restoreFocus}
				opened={createOpened}
			/>
			<ManageCollectionsModal
				onClose={() => setManageOpened(false)}
				onCreateCollection={() => setCreateOpened(true)}
				onExitTransitionEnd={restoreFocus}
				onViewCollection={(collectionId) => {
					const collection = collections.find(
						(item) => item.id === collectionId,
					);
					if (collection) {
						navigate(`/?collection=${encodeURIComponent(collection.name)}`);
					}
				}}
				opened={manageOpened}
			/>
		</>
	);
};

const AddToCollectionMenu = ({ font }: { font: FontSummary }) => (
	<CollectionPicker fonts={[font]} variant="font" />
);

const AddFontSetToCollectionMenu = ({
	fonts,
}: {
	fonts: readonly FontSummary[];
}) => <CollectionPicker fonts={fonts} variant="font-set" />;

export { AddFontSetToCollectionMenu, AddToCollectionMenu };
