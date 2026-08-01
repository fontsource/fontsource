import { useMount } from '@legendapp/state/react';
import { syncObservable } from '@legendapp/state/sync';
import { createContext, type ReactNode, useContext, useState } from 'react';
import invariant from 'tiny-invariant';

import { FailSafeLocalStorage } from '@/utils/legend-persistence';

import classes from './CollectionsProvider.module.css';
import { collectionsSnapshotSchema } from './model';
import { type CollectionsStore, createCollectionsStore } from './store';

const STORAGE_KEY = 'fontsource.collections';
const CollectionsContext = createContext<CollectionsStore | undefined>(
	undefined,
);

const CollectionsProvider = ({ children }: { children: ReactNode }) => {
	const [store] = useState(createCollectionsStore);
	const [storageError, setStorageError] = useState(false);

	useMount(() => {
		try {
			// Legend restores persisted values without applying the Zod schema. Validate
			// first so incompatible or partial snapshots never enter the live store.
			const storedValue = localStorage.getItem(STORAGE_KEY);
			if (storedValue !== null) {
				collectionsSnapshotSchema.parse(JSON.parse(storedValue));
			}
		} catch {
			setStorageError(true);
			store.ready$.set(true);
			return;
		}

		syncObservable(store.state$, {
			persist: {
				name: STORAGE_KEY,
				plugin: new FailSafeLocalStorage(() => setStorageError(true)),
			},
		});
	});

	return (
		<CollectionsContext.Provider value={store}>
			{children}
			{storageError && (
				<div className={classes.error} role="alert">
					Collections are available for this session but cannot be saved.
				</div>
			)}
		</CollectionsContext.Provider>
	);
};

const useCollectionsStore = () => {
	const store = useContext(CollectionsContext);
	invariant(
		store,
		'useCollectionsStore must be used within CollectionsProvider.',
	);
	return store;
};

export { CollectionsProvider, useCollectionsStore };
