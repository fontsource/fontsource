import { z } from 'zod';

import type { FontSummary } from '@/utils/types';

const FAVORITES_COLLECTION_ID = 'favorites';
const MAX_COLLECTION_NAME_LENGTH = 64;

const fontSummarySchema: z.ZodType<FontSummary> = z.object({
	id: z.string().min(1),
	family: z.string().min(1),
	defSubset: z.string().min(1),
	category: z.string().min(1),
	variable: z.boolean(),
});

const fontCollectionSchema = z.object({
	id: z.string().min(1),
	kind: z.enum(['favorites', 'custom']),
	name: z.string().trim().min(1).max(MAX_COLLECTION_NAME_LENGTH),
	fontIds: z.array(z.string().min(1)),
});

const collectionsSnapshotSchema = z
	.object({
		version: z.literal(1),
		collections: z.array(fontCollectionSchema),
		fontCache: z.record(z.string(), fontSummarySchema),
	})
	.refine(
		(snapshot) =>
			snapshot.collections.filter(
				(collection) => collection.kind === 'favorites',
			).length === 1,
		{ message: 'Collections must contain exactly one Favorites collection.' },
	)
	.refine(
		(snapshot) =>
			snapshot.collections.every((collection) =>
				collection.fontIds.every((fontId) => snapshot.fontCache[fontId]),
			),
		{ message: 'Every collection font must have cached metadata.' },
	);

type CollectionsSnapshot = z.infer<typeof collectionsSnapshotSchema>;

const createEmptyCollectionsSnapshot = (): CollectionsSnapshot => ({
	version: 1,
	collections: [
		{
			id: FAVORITES_COLLECTION_ID,
			kind: 'favorites',
			name: 'Favorites',
			fontIds: [],
		},
	],
	fontCache: {},
});

export type { CollectionsSnapshot };
export {
	collectionsSnapshotSchema,
	createEmptyCollectionsSnapshot,
	MAX_COLLECTION_NAME_LENGTH,
};
