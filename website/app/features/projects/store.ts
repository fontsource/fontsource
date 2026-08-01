import { observable, syncState } from '@legendapp/state';

import type { CurrentProjectSnapshot, ProjectItem } from './model';

const createCurrentProjectStore = (
	initialSnapshot: CurrentProjectSnapshot = { version: 1, items: [] },
) => {
	const state$ = observable<CurrentProjectSnapshot>(initialSnapshot);
	const ready$ = syncState(state$).isPersistLoaded;

	const isReady = () => ready$.peek();
	const getItems = () => state$.items.map((item$) => item$.get());
	const hasItem = (familyId: string) =>
		state$.items.some((item$) => item$.familyId.peek() === familyId);

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
		hasItem,
		upsertItem,
		removeItem,
		clear,
	};
};

type CurrentProjectStore = ReturnType<typeof createCurrentProjectStore>;

export type { CurrentProjectStore };
export { createCurrentProjectStore };
