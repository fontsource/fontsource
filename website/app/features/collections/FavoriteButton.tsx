import { useValue } from '@legendapp/state/react';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { IconHeart } from '@tabler/icons-react';
import { useState } from 'react';

import type { FontSummary } from '@/utils/font-summary';
import { useCollectionsStore } from './CollectionsProvider';
import classes from './FavoriteButton.module.css';

interface FavoriteButtonProps {
	font: FontSummary;
	withLabel?: boolean;
}

const FavoriteButton = ({ font, withLabel }: FavoriteButtonProps) => {
	const store = useCollectionsStore();
	const reducedMotion = useReducedMotion();
	const [animateFavorite, setAnimateFavorite] = useState(false);
	const ready = useValue(store.ready$);
	const favoritesId = useValue(store.getFavoritesCollectionId);
	const favorite = useValue(() => store.hasFont(favoritesId, font.id));
	const label = `${favorite ? 'Remove' : 'Add'} ${font.family} ${favorite ? 'from' : 'to'} Favorites`;

	const handleClick = () => {
		if (favorite) {
			setAnimateFavorite(false);
			store.removeFontFromCollection(favoritesId, font.id);
		} else {
			if (!reducedMotion) {
				setAnimateFavorite(true);
			}
			store.addFontToCollection(favoritesId, font);
		}
	};

	const icon = (
		<span
			className={classes.icon}
			data-animate={animateFavorite || undefined}
			onAnimationEnd={() => setAnimateFavorite(false)}
		>
			<IconHeart
				aria-hidden="true"
				fill={favorite ? 'currentColor' : 'none'}
				size={withLabel ? 18 : 20}
			/>
		</span>
	);

	if (withLabel) {
		return (
			<Button
				aria-label={label}
				aria-pressed={favorite}
				disabled={!ready}
				leftSection={icon}
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
				{icon}
			</ActionIcon>
		</Tooltip>
	);
};

export { FavoriteButton };
