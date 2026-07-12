import { useValue } from '@legendapp/state/react';
import {
	ActionIcon,
	Button,
	Group,
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
	IconLock,
	IconPencil,
	IconTrash,
	IconX,
} from '@tabler/icons-react';
import { type FormEvent, useState } from 'react';
import classes from './CollectionManager.module.css';
import { useCollectionsStore } from './CollectionsProvider';
import { MAX_COLLECTION_NAME_LENGTH } from './model';

interface CollectionNameFormProps {
	onCreated?: (collectionId: string) => void;
}

interface CreateCollectionModalProps extends CollectionNameFormProps {
	onClose: () => void;
	opened: boolean;
}

interface ManageCollectionsModalProps {
	onClose: () => void;
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

const CollectionNameForm = ({ onCreated }: CollectionNameFormProps) => {
	const store = useCollectionsStore();
	const collections = useValue(store.collections$);
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
	};

	return (
		<form className={classes['create-form']} onSubmit={handleSubmit}>
			<TextInput
				autoFocus
				error={
					duplicateName && normalizedName
						? 'A collection with this name already exists.'
						: undefined
				}
				label="New collection"
				maxLength={MAX_COLLECTION_NAME_LENGTH}
				onChange={(event) => setName(event.currentTarget.value)}
				placeholder="Brand exploration"
				value={name}
			/>
			<Button disabled={!normalizedName || duplicateName} type="submit">
				Create
			</Button>
		</form>
	);
};

const CreateCollectionModal = ({
	onClose,
	onCreated,
	opened,
}: CreateCollectionModalProps) => {
	const fullScreen = useMediaQuery('(max-width: 48em)');

	return (
		<Modal
			centered
			closeButtonProps={{ 'aria-label': 'Close new collection' }}
			fullScreen={fullScreen}
			onClose={onClose}
			opened={opened}
			title={
				<Text c="purple.0" fw={700} fz="xl">
					New collection
				</Text>
			}
		>
			<Stack gap="lg">
				<Text c="dimmed" fz="sm">
					Collections are saved only in this browser.
				</Text>
				<CollectionNameForm
					onCreated={(collectionId) => {
						onCreated?.(collectionId);
						onClose();
					}}
				/>
			</Stack>
		</Modal>
	);
};

const ManageCollectionsModal = ({
	onClose,
	opened,
}: ManageCollectionsModalProps) => {
	const store = useCollectionsStore();
	const collections = useValue(store.collections$);
	const fullScreen = useMediaQuery('(max-width: 48em)');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState('');
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
			size="lg"
			title={
				<Text c="purple.0" fw={700} fz="xl">
					Collections
				</Text>
			}
		>
			<Stack gap="lg">
				<Text c="dimmed" fz="sm">
					Saved only in this browser
				</Text>
				<CollectionNameForm />
				<div className={classes.header}>
					<Text fw={600} fz="sm">
						Collection
					</Text>
					<Text fw={600} fz="sm">
						Fonts
					</Text>
				</div>
				<ScrollArea.Autosize mah="55vh" type="scroll">
					<div className={classes.list}>
						{collections.map((collection) => {
							const isEditing = editingId === collection.id;
							const isDeleting = pendingDeleteId === collection.id;

							return (
								<div className={classes.row} key={collection.id}>
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
												if (event.key === 'Enter') {
													saveCollectionName(collection.id);
												}
												if (event.key === 'Escape') setEditingId(null);
											}}
											value={editingName}
										/>
									) : (
										<Text className={classes.name}>{collection.name}</Text>
									)}
									<Text c="dimmed" fz="sm">
										{collection.fontIds.length}{' '}
										{collection.fontIds.length === 1 ? 'font' : 'fonts'}
									</Text>
									<Group className={classes.actions} gap="xs" wrap="nowrap">
										{collection.kind === 'favorites' ? (
											<Tooltip label="Favorites is always available">
												<ActionIcon
													aria-label="Favorites cannot be renamed or deleted"
													variant="subtle"
												>
													<IconLock size={18} />
												</ActionIcon>
											</Tooltip>
										) : isEditing ? (
											<>
												<Tooltip label="Save name">
													<ActionIcon
														aria-label={`Save ${collection.name} name`}
														disabled={!editingName.trim() || duplicateEditName}
														onClick={() => saveCollectionName(collection.id)}
														variant="subtle"
													>
														<IconCheck size={18} />
													</ActionIcon>
												</Tooltip>
												<Tooltip label="Cancel rename">
													<ActionIcon
														aria-label={`Cancel renaming ${collection.name}`}
														onClick={() => setEditingId(null)}
														variant="subtle"
													>
														<IconX size={18} />
													</ActionIcon>
												</Tooltip>
											</>
										) : isDeleting ? (
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
										) : (
											<>
												<Tooltip label={`Rename ${collection.name}`}>
													<ActionIcon
														aria-label={`Rename ${collection.name}`}
														onClick={() => {
															setEditingId(collection.id);
															setEditingName(collection.name);
														}}
														variant="subtle"
													>
														<IconPencil size={18} />
													</ActionIcon>
												</Tooltip>
												<Tooltip label={`Delete ${collection.name}`}>
													<ActionIcon
														aria-label={`Delete ${collection.name}`}
														color="red"
														onClick={() => setPendingDeleteId(collection.id)}
														variant="subtle"
													>
														<IconTrash size={18} />
													</ActionIcon>
												</Tooltip>
											</>
										)}
									</Group>
								</div>
							);
						})}
					</div>
				</ScrollArea.Autosize>
			</Stack>
		</Modal>
	);
};

export { CreateCollectionModal, ManageCollectionsModal };
