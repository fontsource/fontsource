import { batch, observable, syncState } from '@legendapp/state';
import invariant from 'tiny-invariant';

import type { FontSummary } from '@/utils/font-summary';
import {
	type CollectionsSnapshot,
	createEmptyCollectionsSnapshot,
	formatCollectionName,
	getCollectionNameLength,
	MAX_COLLECTION_NAME_LENGTH,
	normalizeCollectionName,
} from './model';

const createCollectionsStore = (
	initialSnapshot: CollectionsSnapshot = createEmptyCollectionsSnapshot(),
) => {
	const state$ = observable<CollectionsSnapshot>(initialSnapshot);
	const syncState$ = syncState(state$);
	const ready$ = syncState$.isPersistLoaded;

	// Legend loads browser persistence after mount. Mutating before that load could
	// be replaced by hydration or overwrite the user's stored collections.
	const isReady = () => ready$.peek();
	const getCollectionIndex = (collectionId: string) =>
		state$.collections
			.peek()
			.findIndex((collection) => collection.id === collectionId);

	// Collection names are used as readable values in the collection search
	// parameter. Case insensitive uniqueness keeps each URL unambiguous.
	const getAvailableCollectionName = (name: string, ignoredId?: string) => {
		const normalizedName = formatCollectionName(name);
		const normalizedNameKey = normalizeCollectionName(normalizedName);
		const invalidName =
			normalizedName.length === 0 ||
			getCollectionNameLength(normalizedName) > MAX_COLLECTION_NAME_LENGTH ||
			state$.collections
				.peek()
				.some(
					(collection) =>
						collection.id !== ignoredId &&
						normalizeCollectionName(collection.name) === normalizedNameKey,
				);
		return invalidName ? undefined : normalizedName;
	};

	// Font details live in one shared cache because a font may belong to several
	// collections. Remove them only after the final collection reference is gone.
	const pruneFont = (fontId: string) => {
		const isStillUsed = state$.collections
			.peek()
			.some((collection) => collection.fontIds.includes(fontId));
		if (!isStillUsed) state$.fontCache[fontId].delete();
	};

	// Favorites is the permanent target of the heart action. Looking it up by kind
	// keeps that behavior stable when persisted collections are reordered.
	const getFavoritesCollectionId = () => {
		const id = state$.collections
			.find((collection$) => collection$.kind.peek() === 'favorites')
			?.id.get();
		invariant(id, 'Collections state is missing Favorites.');
		return id;
	};
	// Reading every item through Legend keeps list consumers subscribed to nested
	// changes such as renamed collections and updated membership.
	const getCollections = () =>
		state$.collections.map((collection$) => collection$.get());

	const hasFont = (collectionId: string, fontId: string) =>
		state$.collections
			.find((collection$) => collection$.id.peek() === collectionId)
			?.fontIds.get()
			.includes(fontId) ?? false;

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

		// Publish metadata and membership together so collection views never receive
		// a font identifier before its preview data exists.
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
		getCollections,
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
