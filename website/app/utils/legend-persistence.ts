import type { Change } from '@legendapp/state';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';

class FailSafeLocalStorage extends ObservablePersistLocalStorage {
	private failed = false;

	constructor(private readonly onError: () => void) {
		super();
	}

	override set(table: string, changes: Change[]) {
		if (this.failed) return;

		try {
			super.set(table, changes);
		} catch {
			this.failed = true;
			this.onError();
		}
	}
}

export { FailSafeLocalStorage };
