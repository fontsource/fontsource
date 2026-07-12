import { useValue } from '@legendapp/state/react';
import { InputBase, Menu, ScrollArea, Text, TextInput } from '@mantine/core';
import { IconCheck, IconPlus, IconSettings } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { IconCaret } from '@/components/icons';
import classes from './CollectionFilter.module.css';
import {
	CreateCollectionModal,
	ManageCollectionsModal,
} from './CollectionManager';
import { useCollectionsStore } from './CollectionsProvider';

interface CollectionFilterProps {
	onChange: (collectionId: string | null) => void;
	value: string | null;
}

const CollectionFilter = ({ onChange, value }: CollectionFilterProps) => {
	const store = useCollectionsStore();
	const ready = useValue(store.ready$);
	const collections = useValue(store.collections$);
	const [createOpened, setCreateOpened] = useState(false);
	const [manageOpened, setManageOpened] = useState(false);
	const [query, setQuery] = useState('');
	const selectedCollection = collections.find(
		(collection) => collection.id === value,
	);
	const normalizedQuery = query.trim().toLowerCase();
	const visibleCollections = normalizedQuery
		? collections.filter((collection) =>
				collection.name.toLowerCase().includes(normalizedQuery),
			)
		: collections;

	useEffect(() => {
		if (ready && value && !selectedCollection) onChange(null);
	}, [onChange, ready, selectedCollection, value]);

	return (
		<>
			<Menu
				classNames={{ dropdown: classes.dropdown }}
				onClose={() => setQuery('')}
				position="bottom-start"
				shadow="md"
			>
				<Menu.Target>
					<InputBase
						aria-label="Filter by collection"
						classNames={{ input: classes.input }}
						component="button"
						disabled={!ready}
						pointer
						rightSection={<IconCaret />}
						rightSectionPointerEvents="none"
						w={250}
					>
						{selectedCollection?.name ?? 'All fonts'}
					</InputBase>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Item
						leftSection={value === null ? <IconCheck size={16} /> : undefined}
						onClick={() => onChange(null)}
					>
						All fonts
					</Menu.Item>
					<Menu.Divider />
					<Menu.Label>Your collections</Menu.Label>
					{collections.length >= 9 && (
						<div className={classes.search}>
							<TextInput
								aria-label="Search collections"
								onChange={(event) => setQuery(event.currentTarget.value)}
								onClick={(event) => event.stopPropagation()}
								placeholder="Search collections"
								size="xs"
								value={query}
							/>
						</div>
					)}
					<ScrollArea.Autosize mah={240} type="scroll">
						{visibleCollections.length > 0 ? (
							visibleCollections.map((collection) => (
								<Menu.Item
									key={collection.id}
									leftSection={
										value === collection.id ? (
											<IconCheck size={16} />
										) : undefined
									}
									onClick={() => onChange(collection.id)}
									rightSection={
										<Text className={classes.count} c="dimmed" fz="xs">
											{collection.fontIds.length}
										</Text>
									}
								>
									{collection.name}
								</Menu.Item>
							))
						) : (
							<Menu.Label>No matching collections</Menu.Label>
						)}
					</ScrollArea.Autosize>
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
				opened={createOpened}
			/>
			<ManageCollectionsModal
				onClose={() => setManageOpened(false)}
				onCreateCollection={() => setCreateOpened(true)}
				onViewCollection={onChange}
				opened={manageOpened}
			/>
		</>
	);
};

export { CollectionFilter };
