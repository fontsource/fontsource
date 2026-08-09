import { observe } from '@legendapp/state';
import { describe, expect, it } from 'vitest';

import { currentProjectSnapshotSchema, MAX_FONT_SET_SIZE } from './model';
import { createCurrentProjectStore } from './store';

const createReadyStore = () => {
	const store = createCurrentProjectStore();
	store.ready$.set(true);
	return store;
};

describe('font set store', () => {
	it('stores each family once without configuration', () => {
		const store = createReadyStore();
		let count = 0;
		const dispose = observe(() => {
			count = store.getItems().length;
		});

		expect(store.addItem({ familyId: 'fraunces' })).toBe('added');
		expect(store.addItem({ familyId: 'fraunces' })).toBe('exists');

		expect(count).toBe(1);
		expect(store.getItems()).toEqual([{ familyId: 'fraunces' }]);
		dispose();
	});

	it('removes individual families and clears the set', () => {
		const store = createReadyStore();
		store.addItem({ familyId: 'fraunces' });
		store.removeItem('fraunces');
		expect(store.getItems()).toEqual([]);

		store.addItem({ familyId: 'fraunces' });
		store.clear();
		expect(store.getItems()).toEqual([]);
	});

	it('adds missing collection families without duplicates', () => {
		const store = createReadyStore();
		store.addItem({ familyId: 'fraunces' });

		expect(
			store.addItems([
				{ familyId: 'fraunces' },
				{ familyId: 'inter' },
				{ familyId: 'inter' },
			]),
		).toEqual({ addedCount: 1, limitReached: false });
		expect(store.getItems()).toEqual([
			{ familyId: 'inter' },
			{ familyId: 'fraunces' },
		]);
	});

	it('rejects persisted duplicate families', () => {
		const result = currentProjectSnapshotSchema.safeParse([
			{ familyId: 'fraunces' },
			{ familyId: 'fraunces' },
		]);

		expect(result.success).toBe(false);
	});

	it('reports when the family limit prevents additions', () => {
		const store = createReadyStore();
		const families = Array.from({ length: MAX_FONT_SET_SIZE }, (_, index) => ({
			familyId: `family-${index}`,
		}));

		expect(store.addItems(families)).toEqual({
			addedCount: MAX_FONT_SET_SIZE,
			limitReached: false,
		});
		expect(store.addItem({ familyId: 'one-more' })).toBe('full');
		expect(
			store.addItems([
				{ familyId: 'family-0' },
				{ familyId: 'another-family' },
			]),
		).toEqual({ addedCount: 0, limitReached: true });
		expect(store.getItems()).toHaveLength(MAX_FONT_SET_SIZE);
	});
});
