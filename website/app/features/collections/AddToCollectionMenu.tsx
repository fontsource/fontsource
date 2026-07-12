import { useValue } from '@legendapp/state/react';
import {
	ActionIcon,
	Box,
	Menu,
	ScrollArea,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { IconFolderPlus, IconPlus, IconSettings } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import type { FontSummary } from '@/utils/types';
import {
	CreateCollectionModal,
	ManageCollectionsModal,
} from './CollectionManager';
import { useCollectionsStore } from './CollectionsProvider';

interface AddToCollectionMenuProps {
	font: FontSummary;
}

const AddToCollectionMenu = ({ font }: AddToCollectionMenuProps) => {
	const store = useCollectionsStore();
	const navigate = useNavigate();
	const ready = useValue(store.ready$);
	const collections = useValue(store.collections$);
	const customCollections = collections.filter(
		(collection) => collection.kind === 'custom',
	);
	const [query, setQuery] = useState('');
	const normalizedQuery = query.trim().toLowerCase();
	const visibleCollections = normalizedQuery
		? customCollections.filter((collection) =>
				collection.name.toLowerCase().includes(normalizedQuery),
			)
		: customCollections;
	const [createOpened, setCreateOpened] = useState(false);
	const [manageOpened, setManageOpened] = useState(false);
	const label = `Manage collections for ${font.family}`;

	return (
		<>
			<Menu
				closeOnItemClick={false}
				onClose={() => setQuery('')}
				position="bottom-end"
				shadow="md"
			>
				<Menu.Target>
					<Tooltip label={label} openDelay={500}>
						<ActionIcon
							aria-label={label}
							color="purple.0"
							disabled={!ready}
							size="lg"
							type="button"
							variant="transparent"
						>
							<IconFolderPlus size={20} />
						</ActionIcon>
					</Tooltip>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Label>Collections</Menu.Label>
					{customCollections.length >= 9 && (
						<Box px="xs" pb={4}>
							<TextInput
								aria-label="Search collections"
								onChange={(event) => setQuery(event.currentTarget.value)}
								onClick={(event) => event.stopPropagation()}
								placeholder="Search collections"
								size="xs"
								value={query}
							/>
						</Box>
					)}
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
										{collection.name}
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
				opened={createOpened}
			/>
			<ManageCollectionsModal
				onClose={() => setManageOpened(false)}
				onCreateCollection={() => setCreateOpened(true)}
				onViewCollection={(collectionId) =>
					navigate(`/?collection=${encodeURIComponent(collectionId)}`)
				}
				opened={manageOpened}
			/>
		</>
	);
};

export { AddToCollectionMenu };
