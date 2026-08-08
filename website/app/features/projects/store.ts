import { observable, syncState } from '@legendapp/state';

import type { CurrentProjectSnapshot, ProjectItem } from './model';

const createCurrentProjectStore = (
	initialSnapshot: CurrentProjectSnapshot = { version: 1, items: [] },
) => {
	const state$ = observable<CurrentProjectSnapshot>(initialSnapshot);
	const ready$ = syncState(state$).isPersistLoaded;

	const isReady = () => ready$.peek();
	const getItems = () => state$.items.map((item$) => item$.get());

	const upsertItem = (item: ProjectItem) => {
		if (!isReady()) return;

		const index = state$.items
			.peek()
			.findIndex((current) => current.familyId === item.familyId);
		if (index === -1) {
			state$.items.unshift(item);
			return;
		}

		const previous = state$.items[index].peek();
		state$.items[index].set(item);
		return previous;
	};

	const addItems = (items: readonly ProjectItem[]) => {
		if (!isReady()) return 0;

		const existingIds = new Set(
			state$.items.peek().map((item) => item.familyId),
		);
		const additions = items.filter((item) => {
			if (existingIds.has(item.familyId)) return false;
			existingIds.add(item.familyId);
			return true;
		});
		if (additions.length > 0) {
			state$.items.set([...additions, ...state$.items.peek()]);
		}
		return additions.length;
	};

	const removeItem = (familyId: string) => {
		if (!isReady()) return;

		const index = state$.items
			.peek()
			.findIndex((item) => item.familyId === familyId);
		if (index !== -1) state$.items[index].delete();
	};

	const clear = () => {
		if (isReady()) state$.items.set([]);
	};

	return {
		state$,
		ready$,
		getItems,
		upsertItem,
		addItems,
		removeItem,
		clear,
	};
};

type CurrentProjectStore = ReturnType<typeof createCurrentProjectStore>;

export type { CurrentProjectStore };
export { createCurrentProjectStore };
