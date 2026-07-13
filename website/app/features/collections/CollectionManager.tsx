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
	VisuallyHidden,
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
import { type FormEvent, useRef, useState } from 'react';

import type { FontSummary } from '@/utils/font-summary';
import classes from './CollectionManager.module.css';
import menuClasses from './CollectionMenu.module.css';
import { useCollectionsStore } from './CollectionsProvider';
import {
	formatCollectionName,
	getCollectionNameLength,
	MAX_COLLECTION_NAME_LENGTH,
	normalizeCollectionName,
} from './model';

interface CreateCollectionModalProps {
	font?: FontSummary;
	onClose: () => void;
	onCreated?: (collectionId: string) => void;
	onExitTransitionEnd: () => void;
	opened: boolean;
}

interface ManageCollectionsModalProps {
	onClose: () => void;
	onCreateCollection: () => void;
	onExitTransitionEnd: () => void;
	onViewCollection: (collectionId: string) => void;
	opened: boolean;
}

const getDuplicateName = (
	collections: { id: string; name: string }[],
	name: string,
	ignoredId?: string,
) => {
	const normalizedName = normalizeCollectionName(name);
	return collections.some(
		(collection) =>
			collection.id !== ignoredId &&
			normalizeCollectionName(collection.name) === normalizedName,
	);
};

const CreateCollectionModal = ({
	font,
	onClose,
	onCreated,
	onExitTransitionEnd,
	opened,
}: CreateCollectionModalProps) => {
	const store = useCollectionsStore();
	const collections = useValue(store.getCollections);
	const fullScreen = useMediaQuery('(max-width: 48em)');
	const [name, setName] = useState('');
	const [announcement, setAnnouncement] = useState('');
	const normalizedName = formatCollectionName(name);
	const duplicateName = getDuplicateName(collections, normalizedName);
	const nameTooLong =
		getCollectionNameLength(normalizedName) > MAX_COLLECTION_NAME_LENGTH;
	const nameError = duplicateName
		? 'A collection with this name already exists.'
		: nameTooLong
			? `Collection names must be ${MAX_COLLECTION_NAME_LENGTH} characters or fewer.`
			: undefined;
	const close = () => {
		setName('');
		onClose();
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!normalizedName || nameError) return;

		const collectionId = store.createCollection(normalizedName);
		if (!collectionId) return;

		setName('');
		setAnnouncement(
			font
				? `Created ${normalizedName} and added ${font.family}.`
				: `Created ${normalizedName}.`,
		);
		onCreated?.(collectionId);
		close();
	};

	return (
		<>
			<VisuallyHidden role="status">{announcement}</VisuallyHidden>
			<Modal
				centered
				classNames={{
					content: classes['modal-content'],
					header: classes['modal-header'],
				}}
				closeButtonProps={{ 'aria-label': 'Close create collection' }}
				fullScreen={fullScreen}
				onClose={close}
				onExitTransitionEnd={onExitTransitionEnd}
				opened={opened}
				returnFocus={false}
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
							attributes={{ input: { dir: 'auto' } }}
							classNames={{ error: classes.error }}
							data-autofocus
							error={nameError}
							errorProps={{ role: 'alert' }}
							label="Collection name"
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
							<Button onClick={close} type="button" variant="default">
								Cancel
							</Button>
							<Button disabled={!normalizedName || !!nameError} type="submit">
								{font ? `Create and add ${font.family}` : 'Create collection'}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
};

const ManageCollectionsModal = ({
	onClose,
	onCreateCollection,
	onExitTransitionEnd,
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
	const [announcement, setAnnouncement] = useState('');
	const searchRef = useRef<HTMLInputElement>(null);
	const normalizedQuery = normalizeCollectionName(query);
	const visibleCollections = normalizedQuery
		? collections.filter((collection) =>
				normalizeCollectionName(collection.name).includes(normalizedQuery),
			)
		: collections;
	const duplicateEditName = getDuplicateName(
		collections,
		editingName,
		editingId ?? undefined,
	);
	const editingNameTooLong =
		getCollectionNameLength(formatCollectionName(editingName)) >
		MAX_COLLECTION_NAME_LENGTH;
	const editingNameError = duplicateEditName
		? 'Name already in use.'
		: editingNameTooLong
			? `Collection names must be ${MAX_COLLECTION_NAME_LENGTH} characters or fewer.`
			: undefined;
	const focusSearch = () => {
		window.requestAnimationFrame(() => searchRef.current?.focus());
	};

	const saveCollectionName = (collectionId: string) => {
		const collection = collections.find((item) => item.id === collectionId);
		if (store.renameCollection(collectionId, editingName)) {
			setAnnouncement(
				`Renamed ${collection?.name ?? 'collection'} to ${formatCollectionName(editingName)}.`,
			);
			setEditingId(null);
			focusSearch();
		}
	};
	const close = () => {
		setQuery('');
		setEditingId(null);
		setPendingDeleteId(null);
		onClose();
	};

	return (
		<>
			<VisuallyHidden role="status">{announcement}</VisuallyHidden>
			<Modal.Root
				centered
				classNames={{
					content: classes['modal-content'],
					header: classes['modal-header'],
				}}
				fullScreen={fullScreen}
				onClose={close}
				onExitTransitionEnd={onExitTransitionEnd}
				opened={opened}
				returnFocus={false}
				size="xl"
			>
				<Modal.Overlay />
				<Modal.Content>
					<Modal.Header>
						<Modal.Title>
							<Group gap="xs">
								<Text c="purple.0" fw={700} fz="xl">
									Collections
								</Text>
								<Text className={classes.count} fz="xs">
									{collections.length}
								</Text>
							</Group>
						</Modal.Title>
						<Modal.CloseButton aria-label="Close collection manager" />
					</Modal.Header>
					<div className={classes['manage-body']}>
						<Stack gap="md">
							<Group className={classes.controls} justify="space-between">
								<TextInput
									aria-label="Find a collection"
									attributes={{ input: { dir: 'auto' } }}
									data-autofocus
									leftSection={<IconSearch size={16} />}
									onChange={(event) => setQuery(event.currentTarget.value)}
									placeholder="Find a collection"
									ref={searchRef}
									value={query}
								/>
								<Button
									className={classes['primary-action']}
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
							<VisuallyHidden role="status">
								{normalizedQuery
									? `${visibleCollections.length} matching ${visibleCollections.length === 1 ? 'collection' : 'collections'}.`
									: ''}
							</VisuallyHidden>
							<ScrollArea.Autosize mah="55vh" type="scroll">
								<ul className={classes.list}>
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
												<li className={classes.row} key={collection.id}>
													<div className={classes['collection-icon']}>
														{collection.kind === 'favorites' ? (
															<IconHeart
																aria-hidden="true"
																fill="currentColor"
																size={21}
															/>
														) : (
															<IconFolder aria-hidden="true" size={20} />
														)}
													</div>
													<div className={classes.details}>
														{isEditing ? (
															<TextInput
																aria-label={`Rename ${collection.name}`}
																attributes={{ input: { dir: 'auto' } }}
																classNames={{ error: classes.error }}
																data-autofocus
																error={editingNameError}
																errorProps={{ role: 'alert' }}
																onChange={(event) =>
																	setEditingName(event.currentTarget.value)
																}
																onKeyDown={(event) => {
																	if (event.nativeEvent.isComposing) return;
																	if (event.key === 'Enter')
																		saveCollectionName(collection.id);
																	if (event.key === 'Escape') {
																		setEditingId(null);
																		focusSearch();
																	}
																}}
																value={editingName}
															/>
														) : (
															<Group gap={6} wrap="nowrap">
																<Text
																	className={classes.name}
																	dir="auto"
																	fw={600}
																>
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
															<Text c="dimmed" dir="auto" fz="sm" lineClamp={1}>
																{familySummary}
															</Text>
														)}
													</div>
													<Text c="dimmed" fz="sm">
														{collection.fontIds.length}{' '}
														{collection.fontIds.length === 1 ? 'font' : 'fonts'}
													</Text>
													<Group
														className={classes.actions}
														gap="xs"
														wrap="nowrap"
													>
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
																			!formatCollectionName(editingName) ||
																			!!editingNameError
																		}
																		onClick={() =>
																			saveCollectionName(collection.id)
																		}
																		variant="transparent"
																	>
																		<IconCheck size={18} />
																	</ActionIcon>
																</Tooltip>
																<Tooltip label="Cancel rename">
																	<ActionIcon
																		aria-label={`Cancel renaming ${collection.name}`}
																		onClick={() => {
																			setEditingId(null);
																			focusSearch();
																		}}
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
																		setAnnouncement(
																			`Deleted ${collection.name}.`,
																		);
																		setPendingDeleteId(null);
																		focusSearch();
																	}}
																	size="compact-sm"
																	variant="light"
																>
																	Delete
																</Button>
																<Button
																	onClick={() => {
																		setPendingDeleteId(null);
																		focusSearch();
																	}}
																	size="compact-sm"
																	variant="subtle"
																>
																	Cancel
																</Button>
															</>
														) : isCustom ? (
															<Menu
																classNames={{
																	dropdown: menuClasses.dropdown,
																}}
																position="bottom-end"
																shadow="md"
															>
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
																		onClick={() =>
																			setPendingDeleteId(collection.id)
																		}
																	>
																		Delete
																	</Menu.Item>
																</Menu.Dropdown>
															</Menu>
														) : null}
													</Group>
												</li>
											);
										})
									) : (
										<li>
											<Text c="dimmed" py="xl" ta="center">
												No matching collections
											</Text>
										</li>
									)}
								</ul>
							</ScrollArea.Autosize>
						</Stack>
					</div>
				</Modal.Content>
			</Modal.Root>
		</>
	);
};

export { CreateCollectionModal, ManageCollectionsModal };
