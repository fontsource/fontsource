import { useMount } from '@legendapp/state/react';
import { createContext, type ReactNode, useContext, useState } from 'react';
import invariant from 'tiny-invariant';

import { syncValidatedLocalStorage } from '@/utils/legend-persistence';

import classes from './CurrentProjectProvider.module.css';
import { currentProjectSnapshotSchema } from './model';
import { type CurrentProjectStore, createCurrentProjectStore } from './store';

const STORAGE_KEY = 'fontsource.font-set';
const CurrentProjectContext = createContext<CurrentProjectStore | undefined>(
	undefined,
);

const CurrentProjectProvider = ({ children }: { children: ReactNode }) => {
	const [store] = useState(createCurrentProjectStore);
	const [storageUnavailable, setStorageUnavailable] = useState(false);

	useMount(() => {
		syncValidatedLocalStorage({
			key: STORAGE_KEY,
			schema: currentProjectSnapshotSchema,
			state$: store.state$,
			ready$: store.ready$,
			onUnavailable: () => setStorageUnavailable(true),
		});
	});

	return (
		<CurrentProjectContext.Provider value={store}>
			{children}
			{storageUnavailable && (
				<div className={classes.error} role="alert">
					Your font set cannot be saved in this browser. You can keep working in
					this tab, but the selection will be lost when it closes.
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

const useCurrentProjectStoreOptional = () => useContext(CurrentProjectContext);

export {
	CurrentProjectProvider,
	useCurrentProjectStore,
	useCurrentProjectStoreOptional,
};
