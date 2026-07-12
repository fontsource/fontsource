import { describe, expect, it } from 'vitest';

import type { FontSummary } from '@/utils/types';
import { createCollectionsStore } from './store';

const inter: FontSummary = {
	id: 'inter',
	family: 'Inter',
	defSubset: 'latin',
	category: 'sans-serif',
	variable: true,
};

const createReadyStore = () => {
	const store = createCollectionsStore();
	store.ready$.set(true);
	return store;
};

describe('collections store', () => {
	it('manages collections and prunes font metadata when it is no longer used', () => {
		const store = createReadyStore();
		const favoritesId = store.getFavoritesCollectionId();
		const collectionId = store.createCollection('Brand exploration');

		expect(store.createCollection('brand EXPLORATION')).toBeUndefined();
		if (!collectionId) throw new Error('Expected a collection to be created.');

		store.addFontToCollection(favoritesId, inter);
		store.addFontToCollection(collectionId, inter);
		expect(store.hasFont(favoritesId, inter.id)).toBe(true);
		expect(store.hasFont(collectionId, inter.id)).toBe(true);

		store.removeFontFromCollection(favoritesId, inter.id);
		expect(store.state$.fontCache[inter.id].peek()).toEqual(inter);

		expect(store.renameCollection(collectionId, 'Shortlist')).toBe(true);
		store.removeFontFromCollection(collectionId, inter.id);
		expect(store.state$.fontCache[inter.id].peek()).toBeUndefined();
		expect(store.state$.collections.peek()).toContainEqual({
			id: collectionId,
			kind: 'custom',
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
		expect(store.state$.collections.peek()).toHaveLength(1);
		expect(store.state$.fontCache[inter.id].peek()).toBeUndefined();
	});
});
