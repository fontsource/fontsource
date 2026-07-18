import { useValue } from '@legendapp/state/react';
import { ActionIcon, Menu, ScrollArea, VisuallyHidden } from '@mantine/core';
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

interface AddToCollectionMenuProps {
	font: FontSummary;
}

const AddToCollectionMenu = ({ font }: AddToCollectionMenuProps) => {
	const store = useCollectionsStore();
	const navigate = useNavigate();
	const ready = useValue(store.ready$);
	const collections = useValue(store.getCollections);
	const customCollections = collections.filter(
		(collection) => collection.kind === 'custom',
	);
	const [query, setQuery] = useState('');
	const normalizedQuery = normalizeCollectionName(query);
	const visibleCollections = normalizedQuery
		? customCollections.filter((collection) =>
				normalizeCollectionName(collection.name).includes(normalizedQuery),
			)
		: customCollections;
	const [createOpened, setCreateOpened] = useState(false);
	const [manageOpened, setManageOpened] = useState(false);
	const targetRef = useRef<HTMLButtonElement>(null);
	const label = `Manage collections for ${font.family}`;
	const restoreFocus = () => {
		if (!createOpened && !manageOpened) targetRef.current?.focus();
	};

	return (
		<>
			<Menu
				classNames={{ dropdown: menuClasses.dropdown }}
				closeOnItemClick={false}
				onClose={() => setQuery('')}
				position="bottom-end"
				shadow="md"
			>
				<Menu.Target>
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
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Label>Collections</Menu.Label>
					{customCollections.length >= 9 && (
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
								const included = collection.fontIds.includes(font.id);
								return (
									<Menu.CheckboxItem
										checked={included}
										key={collection.id}
										onChange={(checked) => {
											if (checked) {
												store.addFontToCollection(collection.id, font);
											} else {
												store.removeFontFromCollection(collection.id, font.id);
											}
										}}
									>
										<span dir="auto">{collection.name}</span>
									</Menu.CheckboxItem>
								);
							})
						) : (
							<Menu.Label>
								{normalizedQuery
									? 'No matching collections'
									: 'No custom collections yet'}
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
				font={font}
				onClose={() => setCreateOpened(false)}
				onCreated={(collectionId) =>
					store.addFontToCollection(collectionId, font)
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

export { AddToCollectionMenu };
