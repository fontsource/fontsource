import { useValue } from '@legendapp/state/react';
import { ActionIcon, Menu, Tooltip } from '@mantine/core';
import { IconCheck, IconFolderPlus } from '@tabler/icons-react';
import { Link } from 'react-router';

import type { FontSummary } from '@/utils/types';
import { useCollectionsStore } from './CollectionsProvider';

interface AddToCollectionMenuProps {
	font: FontSummary;
}

const AddToCollectionMenu = ({ font }: AddToCollectionMenuProps) => {
	const store = useCollectionsStore();
	const ready = useValue(store.ready$);
	const collections = useValue(store.collections$);
	const label = `Manage collections for ${font.family}`;

	return (
		<Menu closeOnItemClick={false} position="bottom-end" shadow="md">
			<Menu.Target>
				<Tooltip label={label} openDelay={500}>
					<ActionIcon
						aria-label={label}
						color="purple.0"
						disabled={!ready}
						size="lg"
						type="button"
						variant="subtle"
					>
						<IconFolderPlus size={20} />
					</ActionIcon>
				</Tooltip>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>Collections</Menu.Label>
				{collections.map((collection) => {
					const included = collection.fontIds.includes(font.id);
					return (
						<Menu.Item
							aria-checked={included}
							key={collection.id}
							leftSection={included ? <IconCheck size={16} /> : undefined}
							onClick={() => {
								if (included) {
									store.removeFontFromCollection(collection.id, font.id);
								} else {
									store.addFontToCollection(collection.id, font);
								}
							}}
							role="menuitemcheckbox"
						>
							{collection.name}
						</Menu.Item>
					);
				})}
				<Menu.Divider />
				<Menu.Item component={Link} to="/collections">
					Manage collections
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
};

export { AddToCollectionMenu };
