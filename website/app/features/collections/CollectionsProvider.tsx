import { useMount } from '@legendapp/state/react';
import { createContext, type ReactNode, useContext, useState } from 'react';
import invariant from 'tiny-invariant';

import { syncValidatedLocalStorage } from '@/utils/legend-persistence';

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
		syncValidatedLocalStorage({
			key: STORAGE_KEY,
			schema: collectionsSnapshotSchema,
			state$: store.state$,
			ready$: store.ready$,
			onUnavailable: () => setStorageError(true),
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
