import { useValue } from '@legendapp/state/react';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { IconHeart } from '@tabler/icons-react';

import type { FontSummary } from '@/utils/font-summary';
import { useCollectionsStore } from './CollectionsProvider';

interface FavoriteButtonProps {
	font: FontSummary;
	withLabel?: boolean;
}

const FavoriteButton = ({ font, withLabel }: FavoriteButtonProps) => {
	const store = useCollectionsStore();
	const ready = useValue(store.ready$);
	const favoritesId = useValue(store.getFavoritesCollectionId);
	const favorite = useValue(() => store.hasFont(favoritesId, font.id));
	const label = `${favorite ? 'Remove' : 'Add'} ${font.family} ${favorite ? 'from' : 'to'} Favorites`;

	const handleClick = () => {
		if (favorite) {
			store.removeFontFromCollection(favoritesId, font.id);
		} else {
			store.addFontToCollection(favoritesId, font);
		}
	};

	if (withLabel) {
		return (
			<Button
				aria-label={label}
				aria-pressed={favorite}
				disabled={!ready}
				leftSection={
					<IconHeart
						aria-hidden="true"
						fill={favorite ? 'currentColor' : 'none'}
						size={18}
					/>
				}
				onClick={handleClick}
				type="button"
				variant="default"
			>
				{favorite ? 'Saved' : 'Save'}
			</Button>
		);
	}

	return (
		<Tooltip label={label} openDelay={500}>
			<ActionIcon
				aria-label={label}
				aria-pressed={favorite}
				color="purple.0"
				data-m:click={`favorite=${favorite ? 'remove' : 'add'};font=${font.id}`}
				disabled={!ready}
				onClick={handleClick}
				size="lg"
				type="button"
				variant="transparent"
			>
				<IconHeart fill={favorite ? 'currentColor' : 'none'} size={20} />
			</ActionIcon>
		</Tooltip>
	);
};

export { FavoriteButton };
