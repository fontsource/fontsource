import type { Change, ObservableParam } from '@legendapp/state';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { type PersistMetadata, syncObservable } from '@legendapp/state/sync';

import {
	readStoredValue,
	type StoredValueSchema,
} from '@/utils/browser-storage';

class FailSafeLocalStorage extends ObservablePersistLocalStorage {
	private failed = false;

	constructor(private readonly onError: () => void) {
		super();
	}

	private write(action: () => void) {
		if (this.failed) return;

		try {
			action();
		} catch {
			this.failed = true;
			this.onError();
		}
	}

	override set(table: string, changes: Change[]) {
		this.write(() => super.set(table, changes));
	}

	override setMetadata(table: string, metadata: PersistMetadata) {
		this.write(() => super.setMetadata(table, metadata));
	}

	override deleteTable(table: string) {
		this.write(() => super.deleteTable(table));
		return undefined;
	}

	override deleteMetadata(table: string) {
		this.write(() => super.deleteMetadata(table));
	}
}

interface ValidatedLocalStorageOptions<T> {
	key: string;
	schema: StoredValueSchema<T>;
	state$: ObservableParam<T>;
	ready$: ObservableParam<boolean>;
	onUnavailable: () => void;
}

const syncValidatedLocalStorage = <T>({
	key,
	schema,
	state$,
	ready$,
	onUnavailable,
}: ValidatedLocalStorageOptions<T>) => {
	const fail = () => {
		onUnavailable();
		ready$.set(true);
	};
	const stored = readStoredValue(localStorage, key, schema);

	if (stored.status === 'unavailable') {
		fail();
		return;
	}

	if (stored.status === 'invalid') {
		try {
			localStorage.removeItem(key);
		} catch {
			fail();
			return;
		}
	}

	try {
		if (stored.status === 'valid') {
			state$.set(stored.value);
			localStorage.setItem(key, JSON.stringify(stored.value));
		}
		syncObservable(state$, {
			persist: {
				name: key,
				plugin: new FailSafeLocalStorage(onUnavailable),
			},
		});
	} catch {
		fail();
	}
};

export { syncValidatedLocalStorage };
