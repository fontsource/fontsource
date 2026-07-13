import { useValue } from '@legendapp/state/react';
import {
	InputBase,
	Menu,
	ScrollArea,
	Text,
	VisuallyHidden,
} from '@mantine/core';
import { IconPlus, IconSettings } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import { IconCaret } from '@/components/icons';
import classes from './CollectionFilter.module.css';
import {
	CreateCollectionModal,
	ManageCollectionsModal,
} from './CollectionManager';
import menuClasses from './CollectionMenu.module.css';
import { useCollectionsStore } from './CollectionsProvider';
import { normalizeCollectionName } from './model';

const ALL_FONTS_VALUE = 'all-fonts';

interface CollectionFilterProps {
	onChange: (collectionId: string | null) => void;
	value: string | null;
}

const CollectionFilter = ({ onChange, value }: CollectionFilterProps) => {
	const store = useCollectionsStore();
	const ready = useValue(store.ready$);
	const collections = useValue(store.getCollections);
	const [createOpened, setCreateOpened] = useState(false);
	const [manageOpened, setManageOpened] = useState(false);
	const [query, setQuery] = useState('');
	const targetRef = useRef<HTMLButtonElement>(null);
	const selectedCollection = collections.find(
		(collection) => collection.id === value,
	);
	const selectedCollectionName = selectedCollection?.name;
	const normalizedQuery = normalizeCollectionName(query);
	const visibleCollections = normalizedQuery
		? collections.filter((collection) =>
				normalizeCollectionName(collection.name).includes(normalizedQuery),
			)
		: collections;
	const restoreFocus = () => {
		if (!createOpened && !manageOpened) targetRef.current?.focus();
	};

	// Wait for persistence before treating a missing selection as deleted.
	useEffect(() => {
		if (ready && value && !selectedCollection) onChange(null);
	}, [onChange, ready, selectedCollection, value]);

	// Collection selection lives outside InstantSearch state, so renames do not
	// trigger its router. Keep the readable collection name in the URL in sync.
	useEffect(() => {
		if (!ready || !value || !selectedCollectionName) return;

		const url = new URL(window.location.href);
		if (url.searchParams.get('collection') === selectedCollectionName) return;

		url.searchParams.set('collection', selectedCollectionName);
		window.history.replaceState(window.history.state, '', url);
	}, [ready, selectedCollectionName, value]);

	return (
		<>
			<Menu
				classNames={{
					dropdown: `${menuClasses.dropdown} ${classes.dropdown}`,
				}}
				onClose={() => setQuery('')}
				position="bottom-start"
				shadow="md"
			>
				<Menu.Target>
					<InputBase
						aria-label={`Filter by collection, ${selectedCollection?.name ?? 'All fonts'}`}
						classNames={{ input: classes.input }}
						component="button"
						disabled={!ready}
						pointer
						ref={targetRef}
						rightSection={<IconCaret />}
						rightSectionPointerEvents="none"
						w={250}
					>
						<span dir="auto">{selectedCollection?.name ?? 'All fonts'}</span>
					</InputBase>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.RadioGroup
						onChange={(nextValue) =>
							onChange(nextValue === ALL_FONTS_VALUE ? null : nextValue)
						}
						value={value ?? ALL_FONTS_VALUE}
					>
						<Menu.RadioItem closeMenuOnClick value={ALL_FONTS_VALUE}>
							All fonts
						</Menu.RadioItem>
						<Menu.Divider />
						{collections.length >= 9 && (
							<Menu.Search
								aria-label="Search collections"
								dir="auto"
								onChange={(event) => setQuery(event.currentTarget.value)}
								placeholder="Search collections"
								value={query}
							/>
						)}
						<VisuallyHidden role="status">
							{normalizedQuery
								? `${visibleCollections.length} matching ${visibleCollections.length === 1 ? 'collection' : 'collections'}.`
								: ''}
						</VisuallyHidden>
						<ScrollArea.Autosize mah={240} type="scroll">
							{visibleCollections.length > 0 ? (
								visibleCollections.map((collection) => (
									<Menu.RadioItem
										closeMenuOnClick
										key={collection.id}
										rightSection={
											<Text className={classes.count} c="dimmed" fz="xs">
												{collection.fontIds.length}
												<VisuallyHidden>
													{' '}
													{collection.fontIds.length === 1 ? 'font' : 'fonts'}
												</VisuallyHidden>
											</Text>
										}
										value={collection.id}
									>
										<span dir="auto">{collection.name}</span>
									</Menu.RadioItem>
								))
							) : (
								<Menu.Label>No matching collections</Menu.Label>
							)}
						</ScrollArea.Autosize>
					</Menu.RadioGroup>
					<Menu.Divider />
					<Menu.Item
						closeMenuOnClick
						leftSection={<IconPlus size={16} />}
						onClick={() => setCreateOpened(true)}
					>
						New collection…
					</Menu.Item>
					<Menu.Item
						closeMenuOnClick
						leftSection={<IconSettings size={16} />}
						onClick={() => setManageOpened(true)}
					>
						Manage collections…
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>
			<CreateCollectionModal
				onClose={() => setCreateOpened(false)}
				onExitTransitionEnd={restoreFocus}
				opened={createOpened}
			/>
			<ManageCollectionsModal
				onClose={() => setManageOpened(false)}
				onCreateCollection={() => setCreateOpened(true)}
				onExitTransitionEnd={restoreFocus}
				onViewCollection={onChange}
				opened={manageOpened}
			/>
		</>
	);
};

export { CollectionFilter };
