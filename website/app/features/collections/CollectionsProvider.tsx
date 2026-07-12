import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { syncObservable } from '@legendapp/state/sync';
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import classes from './CollectionsProvider.module.css';
import { collectionsSnapshotSchema } from './model';
import { type CollectionsStore, createCollectionsStore } from './store';

const STORAGE_KEY = 'fontsource.collections';
const CollectionsContext = createContext<CollectionsStore | undefined>(
	undefined,
);

const CollectionsProvider = ({ children }: { children: ReactNode }) => {
	const [store] = useState(createCollectionsStore);
	const initialized = useRef(false);
	const [storageError, setStorageError] = useState(false);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;

		try {
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
				plugin: ObservablePersistLocalStorage,
			},
		});
	}, [store]);

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
	if (!store) {
		throw new Error(
			'useCollectionsStore must be used within CollectionsProvider.',
		);
	}
	return store;
};

export { CollectionsProvider, useCollectionsStore };
