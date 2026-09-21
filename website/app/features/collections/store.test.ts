import { observe } from '@legendapp/state';
import { describe, expect, it } from 'vitest';

import type { FontSummary } from '@/utils/font-summary';
import { collectionsSnapshotSchema } from './model';
import { createCollectionsStore } from './store';

const inter: FontSummary = {
	id: 'inter',
	family: 'Inter',
	defSubset: 'latin',
	category: 'sans-serif',
	variable: true,
};
const interLabel = { family: inter.family };

const createReadyStore = () => {
	const store = createCollectionsStore();
	store.ready$.set(true);
	return store;
};

describe('collections store', () => {
	it('rejects persisted duplicate collection names', () => {
		const result = collectionsSnapshotSchema.safeParse({
			favoriteFontIds: [],
			collections: [
				{
					id: 'duplicate',
					name: ' favorites ',
					fontIds: [],
				},
			],
			fontCache: {},
		});

		expect(result.success).toBe(false);
	});

	it('rejects duplicate persisted collection and font IDs', () => {
		const duplicateCollectionIds = collectionsSnapshotSchema.safeParse({
			favoriteFontIds: [],
			collections: [
				{ id: 'review', name: 'Review', fontIds: [] },
				{ id: 'review', name: 'Later', fontIds: [] },
			],
			fontCache: {},
		});
		const duplicateFontIds = collectionsSnapshotSchema.safeParse({
			favoriteFontIds: ['inter', 'inter'],
			collections: [],
			fontCache: { inter: { family: 'Inter' } },
		});

		expect(duplicateCollectionIds.success).toBe(false);
		expect(duplicateFontIds.success).toBe(false);
	});

	it('reacts to new collections and favorite changes', () => {
		const store = createReadyStore();
		const favoritesId = store.getFavoritesCollectionId();
		let collectionCount = 0;
		let isFavorite = false;
		const disposeCollections = observe(() => {
			collectionCount = store.getCollections().length;
		});
		const disposeFavorite = observe(() => {
			isFavorite = store.hasFont(favoritesId, inter.id);
		});

		store.createCollection('Review');
		store.addFontToCollection(favoritesId, inter);

		expect(collectionCount).toBe(2);
		expect(isFavorite).toBe(true);
		disposeCollections();
		disposeFavorite();
	});

	it('normalizes Unicode names and counts user-perceived characters', () => {
		const store = createReadyStore();
		const decomposedName = 'カ\u3099イド';
		const longCjkName = '𠮷'.repeat(64);

		expect(store.createCollection(decomposedName)).toBeDefined();
		expect(store.createCollection('ガイド')).toBeUndefined();
		expect(store.getCollections()[1].name).toBe('ガイド');
		expect(store.createCollection(longCjkName)).toBeDefined();
		expect(store.createCollection(`${longCjkName}𠮷`)).toBeUndefined();
	});

	it('manages collections and prunes font metadata when it is no longer used', () => {
		const store = createReadyStore();
		const favoritesId = store.getFavoritesCollectionId();
		const collectionId = store.createCollection('Brand exploration');
		const reviewId = store.createCollection('Review');

		expect(store.createCollection('brand EXPLORATION')).toBeUndefined();
		if (!collectionId || !reviewId)
			throw new Error('Expected collections to be created.');
		expect(
			store.renameCollection(reviewId, ' BRAND EXPLORATION '),
		).toBeUndefined();

		store.addFontToCollection(favoritesId, inter);
		store.addFontToCollection(collectionId, inter);
		expect(store.hasFont(favoritesId, inter.id)).toBe(true);
		expect(store.hasFont(collectionId, inter.id)).toBe(true);

		store.removeFontFromCollection(favoritesId, inter.id);
		expect(store.state$.fontCache[inter.id].peek()).toEqual(interLabel);

		expect(store.renameCollection(collectionId, 'Shortlist')).toBe(true);
		store.removeFontFromCollection(collectionId, inter.id);
		expect(store.state$.fontCache[inter.id].peek()).toBeUndefined();
		expect(store.state$.collections.peek()).toContainEqual({
			id: collectionId,
			name: 'Shortlist',
			fontIds: [],
		});
	});

	it('protects Favorites and prunes metadata when deleting a collection', () => {
		const store = createReadyStore();
		const favoritesId = store.getFavoritesCollectionId();
		const collectionId = store.createCollection('Review');
		if (!collectionId) throw new Error('Expected a collection to be created.');

		expect(store.renameCollection(favoritesId, 'Liked')).toBeUndefined();
		store.deleteCollection(favoritesId);
		expect(store.getFavoritesCollectionId()).toBe(favoritesId);

		store.addFontToCollection(collectionId, inter);
		store.deleteCollection(collectionId);
		expect(store.state$.collections.peek()).toHaveLength(0);
		expect(store.state$.fontCache[inter.id].peek()).toBeUndefined();
	});

	it('adds font sets without duplicating collection entries', () => {
		const store = createReadyStore();
		const collectionId = store.createCollection('Website set');
		if (!collectionId) throw new Error('Expected a collection to be created.');
		const roboto = { ...inter, id: 'roboto', family: 'Roboto' };

		expect(
			store.addFontsToCollection(collectionId, [inter, roboto, inter]),
		).toBe(2);
		expect(store.addFontsToCollection(collectionId, [inter])).toBe(0);
		expect(store.state$.collections[0].fontIds.peek()).toEqual([
			'inter',
			'roboto',
		]);
	});

	it('preserves shared canonical metadata when adding a font to another collection', () => {
		const store = createReadyStore();
		const firstCollection = store.createCollection('First');
		const secondCollection = store.createCollection('Second');
		if (!firstCollection || !secondCollection) throw new Error('missing ids');

		store.addFontToCollection(firstCollection, inter);
		store.addFontToCollection(secondCollection, {
			id: inter.id,
			family: 'Different cached label',
		});

		expect(store.state$.fontCache.inter.peek()).toEqual(interLabel);
	});

	it('derives Favorites without persisting it as a collection', () => {
		const store = createReadyStore();
		const favoritesId = store.getFavoritesCollectionId();

		store.addFontToCollection(favoritesId, inter);

		expect(store.state$.favoriteFontIds.peek()).toEqual([inter.id]);
		expect(store.state$.collections.peek()).toEqual([]);
		expect(store.getCollections()[0]).toMatchObject({
			id: favoritesId,
			kind: 'favorites',
			name: 'Favorites',
			fontIds: [inter.id],
		});
	});
});
