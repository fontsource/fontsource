import { z } from 'zod';

import type { FontSummary } from '@/utils/font-summary';

const FAVORITES_COLLECTION_ID = 'favorites';
const MAX_COLLECTION_NAME_LENGTH = 64;
const collectionNameSegmenter = new Intl.Segmenter(undefined, {
	granularity: 'grapheme',
});

// Preserve the user's spelling for display while comparing a normalized form so
// visually equivalent Unicode input cannot create ambiguous collection URLs.
const formatCollectionName = (name: string) => name.trim().normalize('NFC');
const normalizeCollectionName = (name: string) =>
	formatCollectionName(name).toLowerCase().normalize('NFC');

// Collection limits are based on visible characters. Grapheme segmentation keeps
// composed scripts and emoji from being penalized for their code point count.
const getCollectionNameLength = (name: string) =>
	Array.from(collectionNameSegmenter.segment(name)).length;

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
	name: z
		.string()
		.trim()
		.min(1)
		.refine(
			(name) => getCollectionNameLength(name) <= MAX_COLLECTION_NAME_LENGTH,
		),
	fontIds: z.array(z.string().min(1)),
});

// Persisted snapshots are untrusted input. These refinements protect the store
// assumptions behind the permanent Favorites action and name based filtering.
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
			new Set(
				snapshot.collections.map((collection) =>
					normalizeCollectionName(collection.name),
				),
			).size === snapshot.collections.length,
		{ message: 'Collection names must be unique.' },
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
	formatCollectionName,
	getCollectionNameLength,
	MAX_COLLECTION_NAME_LENGTH,
	normalizeCollectionName,
};
