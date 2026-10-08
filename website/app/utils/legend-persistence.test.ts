import { afterEach, expect, it, vi } from 'vitest';

import { currentProjectSnapshotSchema } from '@/features/projects/model';
import { createCurrentProjectStore } from '@/features/projects/store';
import { syncValidatedLocalStorage } from './legend-persistence';

afterEach(() => vi.unstubAllGlobals());

it('keeps the font set usable when access to localStorage is denied', () => {
	vi.stubGlobal('localStorage', undefined);
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		get: () => {
			throw new DOMException('Storage access denied', 'SecurityError');
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

	expect(onUnavailable).toHaveBeenCalledOnce();
	expect(store.ready$.get()).toBe(true);
	expect(store.addItem({ familyId: 'inter' })).toBe('added');
	expect(store.getItems()).toEqual([{ familyId: 'inter' }]);
	store.removeItem('inter');
	expect(store.getItems()).toEqual([]);
});
