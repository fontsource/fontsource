import { useValue } from '@legendapp/state/react';
import {
	Box,
	Button,
	Group,
	SimpleGrid,
	Slider,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { useState } from 'react';
import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';
import { DropdownSimple } from '@/components/Dropdown';
import { DEFAULT_PREVIEW_TEXT, FontCard } from '@/components/FontCard';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { useCollectionsStore } from '@/features/collections/CollectionsProvider';
import { MAX_COLLECTION_NAME_LENGTH } from '@/features/collections/model';
import classes from '@/styles/global.module.css';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () =>
	ogMeta({
		title: 'Collections | Fontsource',
		description: 'Review font families saved in this browser.',
	});

export default function Collections() {
	const store = useCollectionsStore();
	const collections = useValue(store.collections$);
	const ready = useValue(store.ready$);
	const favoritesId = useValue(store.getFavoritesCollectionId);
	const [selectedCollectionId, setSelectedCollectionId] = useState(favoritesId);
	const [preview, setPreview] = useState('');
	const [size, setSize] = useState(32);
	const [newCollectionName, setNewCollectionName] = useState('');
	const normalizedName = newCollectionName.trim();
	const duplicateName = collections.some(
		(collection) =>
			collection.name.toLowerCase() === normalizedName.toLowerCase(),
	);
	const selectedCollection =
		collections.find((collection) => collection.id === selectedCollectionId) ??
		collections[0];
	const fonts = useValue(() =>
		selectedCollection ? store.getFonts(selectedCollection.id) : [],
	);

	const handleCreateCollection = () => {
		const collectionId = store.createCollection(newCollectionName);
		if (!collectionId) return;

		setSelectedCollectionId(collectionId);
		setNewCollectionName('');
	};

	const handleDeleteCollection = () => {
		if (
			!selectedCollection ||
			selectedCollection.kind === 'favorites' ||
			!window.confirm(
				`Delete ${selectedCollection.name}? Fonts saved in other collections will not be affected.`,
			)
		) {
			return;
		}

		store.deleteCollection(selectedCollection.id);
		setSelectedCollectionId(favoritesId);
	};

	return (
		<>
			<ContentHeader>
				<Stack gap={4}>
					<Title order={1} c="purple.0">
						Collections
					</Title>
					<Text>Collections are saved only in this browser.</Text>
				</Stack>
			</ContentHeader>
			<Box className={classes.container}>
				{!ready ? (
					<Text aria-live="polite">Loading collections…</Text>
				) : (
					<Stack gap="xl">
						<Group align="flex-end" wrap="wrap">
							<Box>
								<Text fz="sm" mb={8}>
									Collection
								</Text>
								<DropdownSimple
									items={collections.map((collection) => ({
										label: `${collection.name} (${collection.fontIds.length})`,
										value: collection.id,
										isRefined: collection.id === selectedCollection?.id,
									}))}
									label={selectedCollection?.name ?? 'Collections'}
									refine={setSelectedCollectionId}
									w={260}
								/>
							</Box>
							<TextInput
								error={
									duplicateName && normalizedName.length > 0
										? 'A collection with this name already exists.'
										: undefined
								}
								label="New collection"
								maxLength={MAX_COLLECTION_NAME_LENGTH}
								onChange={(event) =>
									setNewCollectionName(event.currentTarget.value)
								}
								onKeyDown={(event) => {
									if (
										event.key === 'Enter' &&
										normalizedName &&
										!duplicateName
									) {
										handleCreateCollection();
									}
								}}
								placeholder="Brand exploration"
								value={newCollectionName}
							/>
							<Button
								disabled={!normalizedName || duplicateName}
								onClick={handleCreateCollection}
							>
								Create
							</Button>
							{selectedCollection?.kind !== 'favorites' && (
								<Button
									color="red"
									onClick={handleDeleteCollection}
									variant="subtle"
								>
									Delete
								</Button>
							)}
						</Group>

						<Group align="flex-end" grow wrap="wrap">
							<TextInput
								label="Preview text"
								onChange={(event) => setPreview(event.currentTarget.value)}
								placeholder={DEFAULT_PREVIEW_TEXT}
								value={preview}
							/>
							<Box miw={240}>
								<Text fz="sm" mb={8}>
									Size: {size} px
								</Text>
								<Slider
									color="purple.0"
									label={null}
									onChange={setSize}
									thumbLabel="Change font size"
									value={size}
								/>
							</Box>
						</Group>

						<Group justify="space-between">
							<Title order={2}>{selectedCollection?.name}</Title>
							<Text>
								{fonts.length} {fonts.length === 1 ? 'family' : 'families'}
							</Text>
						</Group>

						{fonts.length > 0 ? (
							<SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing={16}>
								{fonts.map((font) => (
									<FontCard
										font={font}
										key={font.id}
										preview={preview}
										size={size}
									/>
								))}
							</SimpleGrid>
						) : (
							<Stack align="flex-start" gap="md" py={48}>
								<Title order={3}>No fonts here yet</Title>
								<Text>
									Use the heart or collections menu on a font to add it here.
								</Text>
								<Button component={Link} to="/">
									Browse fonts
								</Button>
							</Stack>
						)}
					</Stack>
				)}
			</Box>
		</>
	);
}
