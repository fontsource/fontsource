import { batch, observable, syncState } from '@legendapp/state';
import invariant from 'tiny-invariant';

import type { FontSummary } from '@/utils/types';
import {
	type CollectionsSnapshot,
	createEmptyCollectionsSnapshot,
	MAX_COLLECTION_NAME_LENGTH,
} from './model';

const createCollectionsStore = (
	initialSnapshot: CollectionsSnapshot = createEmptyCollectionsSnapshot(),
) => {
	const state$ = observable<CollectionsSnapshot>(initialSnapshot);
	const syncState$ = syncState(state$);
	const ready$ = syncState$.isPersistLoaded;

	const isReady = () => ready$.peek();
	const getCollectionIndex = (collectionId: string) =>
		state$.collections
			.peek()
			.findIndex((collection) => collection.id === collectionId);
	const getAvailableCollectionName = (name: string, ignoredId?: string) => {
		const normalizedName = name.trim();
		const invalidName =
			normalizedName.length === 0 ||
			normalizedName.length > MAX_COLLECTION_NAME_LENGTH ||
			state$.collections
				.peek()
				.some(
					(collection) =>
						collection.id !== ignoredId &&
						collection.name.toLowerCase() === normalizedName.toLowerCase(),
				);
		return invalidName ? undefined : normalizedName;
	};
	const pruneFont = (fontId: string) => {
		const isStillUsed = state$.collections
			.peek()
			.some((collection) => collection.fontIds.includes(fontId));
		if (!isStillUsed) state$.fontCache[fontId].delete();
	};

	const getFavoritesCollectionId = () => {
		const id = state$.collections
			.find((collection$) => collection$.kind.peek() === 'favorites')
			?.id.get();
		invariant(id, 'Collections state is missing Favorites.');
		return id;
	};

	const hasFont = (collectionId: string, fontId: string) =>
		state$.collections
			.find((collection$) => collection$.id.peek() === collectionId)
			?.fontIds.includes(fontId) ?? false;

	const createCollection = (name: string) => {
		if (!isReady()) return;

		const normalizedName = getAvailableCollectionName(name);
		if (!normalizedName) return;

		const id = crypto.randomUUID();
		state$.collections.push({
			id,
			kind: 'custom',
			name: normalizedName,
			fontIds: [],
		});
		return id;
	};

	const renameCollection = (collectionId: string, name: string) => {
		if (!isReady()) return;

		const collectionIndex = getCollectionIndex(collectionId);
		if (
			collectionIndex === -1 ||
			state$.collections[collectionIndex].kind.peek() === 'favorites'
		) {
			return;
		}
		const normalizedName = getAvailableCollectionName(name, collectionId);
		if (!normalizedName) return;

		state$.collections[collectionIndex].name.set(normalizedName);
		return true;
	};

	const deleteCollection = (collectionId: string) => {
		if (!isReady()) return;

		const collectionIndex = getCollectionIndex(collectionId);
		if (
			collectionIndex === -1 ||
			state$.collections[collectionIndex].kind.peek() === 'favorites'
		) {
			return;
		}

		const fontIds = state$.collections[collectionIndex].fontIds.peek();
		batch(() => {
			state$.collections[collectionIndex].delete();
			fontIds.forEach(pruneFont);
		});
	};

	const addFontToCollection = (collectionId: string, font: FontSummary) => {
		if (!isReady()) return;

		const collectionIndex = getCollectionIndex(collectionId);
		if (collectionIndex === -1) return;

		const fontIds$ = state$.collections[collectionIndex].fontIds;
		if (fontIds$.peek().includes(font.id)) return;

		batch(() => {
			state$.fontCache[font.id].set(font);
			fontIds$.unshift(font.id);
		});
	};

	const removeFontFromCollection = (collectionId: string, fontId: string) => {
		if (!isReady()) return;

		const collectionIndex = getCollectionIndex(collectionId);
		if (collectionIndex === -1) return;

		const fontIndex = state$.collections[collectionIndex].fontIds
			.peek()
			.indexOf(fontId);
		if (fontIndex === -1) return;

		batch(() => {
			state$.collections[collectionIndex].fontIds[fontIndex].delete();
			pruneFont(fontId);
		});
	};

	return {
		state$,
		collections$: state$.collections,
		ready$,
		getFavoritesCollectionId,
		hasFont,
		createCollection,
		renameCollection,
		deleteCollection,
		addFontToCollection,
		removeFontFromCollection,
	};
};

type CollectionsStore = ReturnType<typeof createCollectionsStore>;

export type { CollectionsStore };
export { createCollectionsStore };
