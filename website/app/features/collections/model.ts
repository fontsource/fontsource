import { z } from 'zod';

const FAVORITES_COLLECTION_ID = 'favorites';
const MAX_COLLECTION_NAME_LENGTH = 64;
const collectionNameSegmenter = new Intl.Segmenter(undefined, {
	granularity: 'grapheme',
});

// Preserve the user's spelling for display while comparing equivalent input.
const formatCollectionName = (name: string) => name.trim().normalize('NFC');
const normalizeCollectionName = (name: string) =>
	formatCollectionName(name).toLowerCase().normalize('NFC');

// Collection limits are based on visible characters. Grapheme segmentation keeps
// composed scripts and emoji from being penalized for their code point count.
const getCollectionNameLength = (name: string) =>
	Array.from(collectionNameSegmenter.segment(name)).length;

const collectionFontLabelSchema = z.object({
	id: z.string().min(1),
	family: z.string().min(1),
});

const cachedFontLabelSchema = collectionFontLabelSchema.omit({ id: true });

const fontCollectionSchema = z.object({
	id: z.string().min(1),
	name: z
		.string()
		.trim()
		.min(1)
		.refine(
			(name) => getCollectionNameLength(name) <= MAX_COLLECTION_NAME_LENGTH,
		),
	fontIds: z.array(z.string().min(1)),
});

const collectionsSnapshotSchema = z
	.object({
		favoriteFontIds: z.array(z.string().min(1)),
		collections: z.array(fontCollectionSchema),
		fontCache: z.record(z.string(), cachedFontLabelSchema),
	})
	.superRefine((snapshot, context) => {
		const unique = (values: readonly string[]) =>
			new Set(values).size === values.length;
		if (!unique(snapshot.favoriteFontIds)) {
			context.addIssue({
				code: 'custom',
				message: 'Favorite font IDs must be unique.',
			});
		}
		if (!unique(snapshot.collections.map((collection) => collection.id))) {
			context.addIssue({
				code: 'custom',
				message: 'Collection IDs must be unique.',
			});
		}
		for (const collection of snapshot.collections) {
			if (!unique(collection.fontIds)) {
				context.addIssue({
					code: 'custom',
					message: `Font IDs in ${collection.name} must be unique.`,
				});
			}
		}
	})
	.refine(
		(snapshot) =>
			new Set([
				'favorites',
				...snapshot.collections.map((collection) =>
					normalizeCollectionName(collection.name),
				),
			]).size ===
			snapshot.collections.length + 1,
		{ message: 'Collection names must be unique.' },
	)
	.refine(
		(snapshot) => {
			const fontIds = [
				...snapshot.favoriteFontIds,
				...snapshot.collections.flatMap((collection) => collection.fontIds),
			];
			return fontIds.every((fontId) => snapshot.fontCache[fontId]);
		},
		{ message: 'Every collection font must have cached metadata.' },
	);

type CollectionsSnapshot = z.infer<typeof collectionsSnapshotSchema>;
type CollectionFontLabel = z.infer<typeof collectionFontLabelSchema>;

const createEmptyCollectionsSnapshot = (): CollectionsSnapshot => ({
	favoriteFontIds: [],
	collections: [],
	fontCache: {},
});

export type { CollectionFontLabel, CollectionsSnapshot };
export {
	collectionsSnapshotSchema,
	createEmptyCollectionsSnapshot,
	FAVORITES_COLLECTION_ID,
	formatCollectionName,
	getCollectionNameLength,
	MAX_COLLECTION_NAME_LENGTH,
	normalizeCollectionName,
};
