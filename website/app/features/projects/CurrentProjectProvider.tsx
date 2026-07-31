import type { Change } from '@legendapp/state';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { useMount } from '@legendapp/state/react';
import { syncObservable } from '@legendapp/state/sync';
import { createContext, type ReactNode, useContext, useState } from 'react';
import invariant from 'tiny-invariant';

import classes from './CurrentProjectProvider.module.css';
import { currentProjectSnapshotSchema } from './model';
import { type CurrentProjectStore, createCurrentProjectStore } from './store';

const STORAGE_KEY = 'fontsource.current-project';
type StorageIssue = 'invalid' | 'unavailable';
const CurrentProjectContext = createContext<CurrentProjectStore | undefined>(
	undefined,
);

class CurrentProjectLocalStorage extends ObservablePersistLocalStorage {
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

const CurrentProjectProvider = ({ children }: { children: ReactNode }) => {
	const [store] = useState(createCurrentProjectStore);
	const [storageIssue, setStorageIssue] = useState<StorageIssue>();

	useMount(() => {
		let storedValue: string | null;
		try {
			storedValue = localStorage.getItem(STORAGE_KEY);
		} catch {
			setStorageIssue('unavailable');
			store.ready$.set(true);
			return;
		}

		if (storedValue !== null) {
			try {
				currentProjectSnapshotSchema.parse(JSON.parse(storedValue));
			} catch {
				setStorageIssue('invalid');
				store.ready$.set(true);
				return;
			}
		}

		try {
			syncObservable(store.state$, {
				persist: {
					name: STORAGE_KEY,
					plugin: new CurrentProjectLocalStorage(() =>
						setStorageIssue('unavailable'),
					),
				},
			});
		} catch {
			setStorageIssue('unavailable');
			store.ready$.set(true);
		}
	});

	const resetSavedFontSet = () => {
		try {
			localStorage.removeItem(STORAGE_KEY);
			window.location.reload();
		} catch {
			setStorageIssue('unavailable');
		}
	};

	return (
		<CurrentProjectContext.Provider value={store}>
			{children}
			{storageIssue && (
				<div className={classes.error} role="alert">
					<span>
						{storageIssue === 'invalid'
							? 'The saved font set cannot be read. Reset it to start with an empty set.'
							: 'Your font set cannot be saved in this browser. You can keep working in this tab, but the selection will be lost when it closes.'}
					</span>
					{storageIssue === 'invalid' && (
						<button type="button" onClick={resetSavedFontSet}>
							Reset saved font set
						</button>
					)}
				</div>
			)}
		</CurrentProjectContext.Provider>
	);
};

const useCurrentProjectStore = () => {
	const store = useContext(CurrentProjectContext);
	invariant(
		store,
		'useCurrentProjectStore must be used within CurrentProjectProvider.',
	);
	return store;
};

export { CurrentProjectProvider, useCurrentProjectStore };
