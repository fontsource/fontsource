import { afterEach, describe, expect, it, vi } from 'vitest';

import { currentProjectSnapshotSchema } from '@/features/projects/model';
import { createCurrentProjectStore } from '@/features/projects/store';
import { syncValidatedLocalStorage } from './legend-persistence';

afterEach(() => vi.unstubAllGlobals());

describe('validated font set persistence', () => {
	it('normalizes duplicate IDs before loading and preserves subsequent removals', async () => {
		const values = new Map([
			[
				'font-set',
				JSON.stringify([
					{ familyId: 'inter' },
					{ familyId: 'roboto' },
					{ familyId: 'inter' },
				]),
			],
		]);
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => values.get(key) ?? null,
			setItem: (key: string, value: string) => values.set(key, value),
			removeItem: (key: string) => values.delete(key),
		});
		const store = createCurrentProjectStore();
		const onUnavailable = vi.fn();
		syncValidatedLocalStorage({
			key: 'font-set',
			schema: currentProjectSnapshotSchema,
			state$: store.state$,
			ready$: store.ready$,
			onUnavailable,
		});
		await vi.waitFor(() => expect(store.ready$.get()).toBe(true));
		expect(store.getItems()).toEqual([
			{ familyId: 'inter' },
			{ familyId: 'roboto' },
		]);
		store.removeItem('inter');
		await vi.waitFor(() =>
			expect(values.get('font-set')).toBe(
				JSON.stringify([{ familyId: 'roboto' }]),
			),
		);
		expect(onUnavailable).not.toHaveBeenCalled();
	});

	it('keeps valid saved fonts usable when storage cannot be written', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => JSON.stringify([{ familyId: 'inter' }]),
			setItem: () => {
				throw new Error('storage blocked');
			},
		});
		const store = createCurrentProjectStore();
		const onUnavailable = vi.fn();
		syncValidatedLocalStorage({
			key: 'font-set',
			schema: currentProjectSnapshotSchema,
			state$: store.state$,
			ready$: store.ready$,
			onUnavailable,
		});
		expect(store.ready$.get()).toBe(true);
		expect(store.getItems()).toEqual([{ familyId: 'inter' }]);
		store.removeItem('inter');
		expect(store.getItems()).toEqual([]);
		expect(onUnavailable).toHaveBeenCalledOnce();
	});
});
