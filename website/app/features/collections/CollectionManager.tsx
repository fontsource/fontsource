import { useValue } from '@legendapp/state/react';
import {
	ActionIcon,
	Button,
	Group,
	Menu,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
	IconCheck,
	IconDots,
	IconEye,
	IconFolder,
	IconHeart,
	IconLock,
	IconPencil,
	IconPlus,
	IconSearch,
	IconTrash,
	IconX,
} from '@tabler/icons-react';
import { type FormEvent, useState } from 'react';

import type { FontSummary } from '@/utils/types';
import classes from './CollectionManager.module.css';
import { useCollectionsStore } from './CollectionsProvider';
import { MAX_COLLECTION_NAME_LENGTH } from './model';

interface CreateCollectionModalProps {
	font?: FontSummary;
	onClose: () => void;
	onCreated?: (collectionId: string) => void;
	opened: boolean;
}

interface ManageCollectionsModalProps {
	onClose: () => void;
	onCreateCollection: () => void;
	onViewCollection: (collectionId: string) => void;
	opened: boolean;
}

const getDuplicateName = (
	collections: { id: string; name: string }[],
	name: string,
	ignoredId?: string,
) => {
	const normalizedName = name.trim().toLowerCase();
	return collections.some(
		(collection) =>
			collection.id !== ignoredId &&
			collection.name.toLowerCase() === normalizedName,
	);
};

const CreateCollectionModal = ({
	font,
	onClose,
	onCreated,
	opened,
}: CreateCollectionModalProps) => {
	const store = useCollectionsStore();
	const collections = useValue(store.getCollections);
	const fullScreen = useMediaQuery('(max-width: 48em)');
	const [name, setName] = useState('');
	const normalizedName = name.trim();
	const duplicateName = getDuplicateName(collections, normalizedName);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!normalizedName || duplicateName) return;

		const collectionId = store.createCollection(normalizedName);
		if (!collectionId) return;

		setName('');
		onCreated?.(collectionId);
		onClose();
	};

	return (
		<Modal
			centered
			closeButtonProps={{ 'aria-label': 'Close create collection' }}
			fullScreen={fullScreen}
			onClose={onClose}
			opened={opened}
			size="lg"
			title={
				<Text c="purple.0" fw={700} fz="xl">
					Create collection
				</Text>
			}
		>
			<form onSubmit={handleSubmit}>
				<Stack gap="md">
					<TextInput
						autoFocus
						error={
							duplicateName && normalizedName
								? 'A collection with this name already exists.'
								: undefined
						}
						label="Collection name"
						maxLength={MAX_COLLECTION_NAME_LENGTH}
						onChange={(event) => setName(event.currentTarget.value)}
						value={name}
					/>
					{font && (
						<div className={classes.context}>
							<IconHeart aria-hidden="true" size={18} />
							<Text className={classes['context-copy']} fz="sm">
								{font.family} will be added to this collection
							</Text>
							<Text c="dimmed" fz="sm">
								{font.category} · {font.variable ? 'variable' : 'static'}
							</Text>
						</div>
					)}
					<Group className={classes['create-actions']} justify="flex-end">
						<Button onClick={onClose} type="button" variant="default">
							Cancel
						</Button>
						<Button disabled={!normalizedName || duplicateName} type="submit">
							{font ? `Create and add ${font.family}` : 'Create collection'}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};

const ManageCollectionsModal = ({
	onClose,
	onCreateCollection,
	onViewCollection,
	opened,
}: ManageCollectionsModalProps) => {
	const store = useCollectionsStore();
	const collections = useValue(store.getCollections);
	const fontCache = useValue(store.state$.fontCache);
	const fullScreen = useMediaQuery('(max-width: 48em)');
	const [query, setQuery] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState('');
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
	const normalizedQuery = query.trim().toLowerCase();
	const visibleCollections = normalizedQuery
		? collections.filter((collection) =>
				collection.name.toLowerCase().includes(normalizedQuery),
			)
		: collections;
	const duplicateEditName = getDuplicateName(
		collections,
		editingName,
		editingId ?? undefined,
	);

	const saveCollectionName = (collectionId: string) => {
		if (store.renameCollection(collectionId, editingName)) {
			setEditingId(null);
		}
	};
	const close = () => {
		setQuery('');
		setEditingId(null);
		setPendingDeleteId(null);
		onClose();
	};

	return (
		<Modal
			centered
			closeButtonProps={{ 'aria-label': 'Close collection manager' }}
			fullScreen={fullScreen}
			onClose={close}
			opened={opened}
			size="xl"
			title={
				<Group gap="xs">
					<Text c="purple.0" fw={700} fz="xl">
						Collections
					</Text>
					<Text className={classes.count} c="dimmed" fz="xs">
						{collections.length}
					</Text>
				</Group>
			}
		>
			<Stack gap="md">
				<Group className={classes.controls} justify="space-between">
					<TextInput
						aria-label="Find a collection"
						leftSection={<IconSearch size={16} />}
						onChange={(event) => setQuery(event.currentTarget.value)}
						placeholder="Find a collection"
						value={query}
					/>
					<Button
						leftSection={<IconPlus size={18} />}
						onClick={() => {
							close();
							onCreateCollection();
						}}
						variant="subtle"
					>
						New collection
					</Button>
				</Group>
				<ScrollArea.Autosize mah="55vh" type="scroll">
					<div>
						{visibleCollections.length > 0 ? (
							visibleCollections.map((collection) => {
								const isEditing = editingId === collection.id;
								const isDeleting = pendingDeleteId === collection.id;
								const isCustom = collection.kind === 'custom';
								const familyNames = collection.fontIds
									.slice(0, 3)
									.map((fontId) => fontCache[fontId].family);
								const remainingFonts =
									collection.fontIds.length - familyNames.length;
								const familySummary =
									familyNames.length === 0
										? 'No fonts yet'
										: `${familyNames.join(', ')}${remainingFonts > 0 ? ` +${remainingFonts}` : ''}`;

								return (
									<div className={classes.row} key={collection.id}>
										<div className={classes['collection-icon']}>
											{collection.kind === 'favorites' ? (
												<IconHeart fill="currentColor" size={21} />
											) : (
												<IconFolder size={20} />
											)}
										</div>
										<div className={classes.details}>
											{isEditing ? (
												<TextInput
													aria-label={`Rename ${collection.name}`}
													autoFocus
													error={
														duplicateEditName && editingName.trim()
															? 'Name already in use.'
															: undefined
													}
													maxLength={MAX_COLLECTION_NAME_LENGTH}
													onChange={(event) =>
														setEditingName(event.currentTarget.value)
													}
													onKeyDown={(event) => {
														if (event.key === 'Enter')
															saveCollectionName(collection.id);
														if (event.key === 'Escape') setEditingId(null);
													}}
													value={editingName}
												/>
											) : (
												<Group gap={6} wrap="nowrap">
													<Text className={classes.name} fw={600}>
														{collection.name}
													</Text>
													{collection.kind === 'favorites' && (
														<IconLock
															aria-label="Built-in collection"
															size={14}
														/>
													)}
												</Group>
											)}
											{!isEditing && (
												<Text c="dimmed" fz="sm" lineClamp={1}>
													{familySummary}
												</Text>
											)}
										</div>
										<Text c="dimmed" fz="sm">
											{collection.fontIds.length}{' '}
											{collection.fontIds.length === 1 ? 'font' : 'fonts'}
										</Text>
										<Group className={classes.actions} gap="xs" wrap="nowrap">
											<Tooltip label={`View ${collection.name}`}>
												<ActionIcon
													aria-label={`View ${collection.name}`}
													onClick={() => {
														onViewCollection(collection.id);
														close();
													}}
													variant="transparent"
												>
													<IconEye size={18} />
												</ActionIcon>
											</Tooltip>
											{isCustom && isEditing ? (
												<>
													<Tooltip label="Save name">
														<ActionIcon
															aria-label={`Save ${collection.name} name`}
															disabled={
																!editingName.trim() || duplicateEditName
															}
															onClick={() => saveCollectionName(collection.id)}
															variant="transparent"
														>
															<IconCheck size={18} />
														</ActionIcon>
													</Tooltip>
													<Tooltip label="Cancel rename">
														<ActionIcon
															aria-label={`Cancel renaming ${collection.name}`}
															onClick={() => setEditingId(null)}
															variant="transparent"
														>
															<IconX size={18} />
														</ActionIcon>
													</Tooltip>
												</>
											) : isCustom && isDeleting ? (
												<>
													<Button
														color="red"
														onClick={() => {
															store.deleteCollection(collection.id);
															setPendingDeleteId(null);
														}}
														size="compact-sm"
														variant="light"
													>
														Delete
													</Button>
													<Button
														onClick={() => setPendingDeleteId(null)}
														size="compact-sm"
														variant="subtle"
													>
														Cancel
													</Button>
												</>
											) : isCustom ? (
												<Menu position="bottom-end" shadow="md">
													<Menu.Target>
														<ActionIcon
															aria-label={`More actions for ${collection.name}`}
															variant="transparent"
														>
															<IconDots size={18} />
														</ActionIcon>
													</Menu.Target>
													<Menu.Dropdown>
														<Menu.Item
															leftSection={<IconPencil size={16} />}
															onClick={() => {
																setEditingId(collection.id);
																setEditingName(collection.name);
															}}
														>
															Rename
														</Menu.Item>
														<Menu.Item
															color="red"
															leftSection={<IconTrash size={16} />}
															onClick={() => setPendingDeleteId(collection.id)}
														>
															Delete
														</Menu.Item>
													</Menu.Dropdown>
												</Menu>
											) : null}
										</Group>
									</div>
								);
							})
						) : (
							<Text c="dimmed" py="xl" ta="center">
								No matching collections
							</Text>
						)}
					</div>
				</ScrollArea.Autosize>
			</Stack>
		</Modal>
	);
};

export { CreateCollectionModal, ManageCollectionsModal };
