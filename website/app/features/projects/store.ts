import { observable, syncState } from '@legendapp/state';

import {
	type CurrentProjectSnapshot,
	type FontSetItem,
	MAX_FONT_SET_SIZE,
} from './model';

const createCurrentProjectStore = (
	initialSnapshot: CurrentProjectSnapshot = [],
) => {
	const state$ = observable<CurrentProjectSnapshot>(initialSnapshot);
	const ready$ = syncState(state$).isPersistLoaded;

	const isReady = () => ready$.peek();
	const getItems = () => state$.map((item$) => item$.get());

	const addItem = (
		item: FontSetItem,
	): 'added' | 'exists' | 'full' | 'not-ready' => {
		if (!isReady()) return 'not-ready';

		const items = state$.peek();
		if (items.some((current) => current.familyId === item.familyId)) {
			return 'exists';
		}
		if (items.length >= MAX_FONT_SET_SIZE) return 'full';

		state$.unshift({ familyId: item.familyId });
		return 'added';
	};

	const addItems = (
		items: readonly FontSetItem[],
	): { addedCount: number; limitReached: boolean } => {
		if (!isReady()) return { addedCount: 0, limitReached: false };

		const currentItems = state$.peek();
		const existingIds = new Set(currentItems.map((item) => item.familyId));
		const missingItems = items.filter((item) => {
			if (existingIds.has(item.familyId)) return false;
			existingIds.add(item.familyId);
			return true;
		});
		const additions = missingItems.slice(
			0,
			Math.max(0, MAX_FONT_SET_SIZE - currentItems.length),
		);
		if (additions.length > 0) {
			state$.set([
				...additions.map(({ familyId }) => ({ familyId })),
				...currentItems,
			]);
		}
		return {
			addedCount: additions.length,
			limitReached: additions.length < missingItems.length,
		};
	};

	const removeItem = (familyId: string) => {
		if (!isReady()) return;

		const index = state$.peek().findIndex((item) => item.familyId === familyId);
		if (index !== -1) state$[index].delete();
	};

	const clear = () => {
		if (isReady()) state$.set([]);
	};

	return {
		state$,
		ready$,
		getItems,
		addItem,
		addItems,
		removeItem,
		clear,
	};
};

type CurrentProjectStore = ReturnType<typeof createCurrentProjectStore>;

export type { CurrentProjectStore };
export { createCurrentProjectStore };
