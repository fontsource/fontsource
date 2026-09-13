import { batch, observable, syncState } from '@legendapp/state';
import {
	type CollectionFontLabel,
	type CollectionsSnapshot,
	createEmptyCollectionsSnapshot,
	FAVORITES_COLLECTION_ID,
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

	const getAvailableCollectionName = (name: string, ignoredId?: string) => {
		const normalizedName = formatCollectionName(name);
		const normalizedNameKey = normalizeCollectionName(normalizedName);
		const invalidName =
			normalizedName.length === 0 ||
			getCollectionNameLength(normalizedName) > MAX_COLLECTION_NAME_LENGTH ||
			normalizedNameKey === 'favorites' ||
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
		const isStillUsed =
			state$.favoriteFontIds.peek().includes(fontId) ||
			state$.collections
				.peek()
				.some((collection) => collection.fontIds.includes(fontId));
		if (!isStillUsed) state$.fontCache[fontId].delete();
	};

	const getFavoritesCollectionId = () => FAVORITES_COLLECTION_ID;
	const getCollections = () => [
		{
			id: FAVORITES_COLLECTION_ID,
			kind: 'favorites' as const,
			name: 'Favorites',
			fontIds: state$.favoriteFontIds.get(),
		},
		...state$.collections.map((collection$) => ({
			...collection$.get(),
			kind: 'custom' as const,
		})),
	];
	const getFontIds$ = (collectionId: string) =>
		collectionId === FAVORITES_COLLECTION_ID
			? state$.favoriteFontIds
			: state$.collections[getCollectionIndex(collectionId)]?.fontIds;

	const hasFont = (collectionId: string, fontId: string) =>
		getFontIds$(collectionId)?.get().includes(fontId) ?? false;

	const createCollection = (name: string) => {
		if (!isReady()) return;

		const normalizedName = getAvailableCollectionName(name);
		if (!normalizedName) return;

		const id = crypto.randomUUID();
		state$.collections.push({
			id,
			name: normalizedName,
			fontIds: [],
		});
		return id;
	};

	const renameCollection = (collectionId: string, name: string) => {
		if (!isReady()) return;

		const collectionIndex = getCollectionIndex(collectionId);
		if (collectionIndex === -1) return;
		const normalizedName = getAvailableCollectionName(name, collectionId);
		if (!normalizedName) return;

		state$.collections[collectionIndex].name.set(normalizedName);
		return true;
	};

	const deleteCollection = (collectionId: string) => {
		if (!isReady()) return;

		const collectionIndex = getCollectionIndex(collectionId);
		if (collectionIndex === -1) return;

		const fontIds = state$.collections[collectionIndex].fontIds.peek();
		batch(() => {
			state$.collections[collectionIndex].delete();
			fontIds.forEach(pruneFont);
		});
	};

	const addFontsToCollection = (
		collectionId: string,
		fonts: readonly CollectionFontLabel[],
	) => {
		if (!isReady()) return;

		const fontIds$ = getFontIds$(collectionId);
		if (!fontIds$) return;
		const existingIds = new Set(fontIds$.peek());
		const additions = fonts.filter((font) => {
			if (existingIds.has(font.id)) return false;
			existingIds.add(font.id);
			return true;
		});
		if (additions.length === 0) return 0;

		// Publish metadata and membership together so collection views never receive
		// a font identifier before its preview data exists.
		batch(() => {
			for (const font of additions) {
				if (!state$.fontCache[font.id].peek()) {
					state$.fontCache[font.id].set({ family: font.family });
				}
			}
			fontIds$.set([...additions.map((font) => font.id), ...fontIds$.peek()]);
		});
		return additions.length;
	};

	const addFontToCollection = (
		collectionId: string,
		font: CollectionFontLabel,
	) => addFontsToCollection(collectionId, [font]);

	const removeFontFromCollection = (collectionId: string, fontId: string) => {
		if (!isReady()) return;

		const fontIds$ = getFontIds$(collectionId);
		if (!fontIds$) return;

		const fontIndex = fontIds$.peek().indexOf(fontId);
		if (fontIndex === -1) return;

		batch(() => {
			fontIds$[fontIndex].delete();
			pruneFont(fontId);
		});
	};

	return {
		state$,
		ready$,
		getCollections,
		getFavoritesCollectionId,
		hasFont,
		createCollection,
		renameCollection,
		deleteCollection,
		addFontToCollection,
		addFontsToCollection,
		removeFontFromCollection,
	};
};

type CollectionsStore = ReturnType<typeof createCollectionsStore>;

export type { CollectionsStore };
export { createCollectionsStore };
