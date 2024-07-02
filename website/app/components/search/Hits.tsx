import { observer, useComputed } from '@legendapp/state/react';
import { Box, Group, SimpleGrid, Skeleton, Text } from '@mantine/core';
import { Link as NavLink } from '@remix-run/react';
import { useEffect, useRef } from 'react';
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch';

import { useIsFontLoaded } from '@/hooks/useIsFontLoaded';
import { getPreviewText } from '@/utils/language/language';
import type { AlgoliaMetadata } from '@/utils/types';

import classes from './Hits.module.css';
import type { SearchState } from './observables';
import { Sort } from './Sort';

interface HitComponentProps {
	state$: SearchState;
	hit: AlgoliaMetadata;
}

interface InfiniteHitsProps {
	state$: SearchState;
}

const HitComponent = observer(({ hit, state$ }: HitComponentProps) => {
	const isFontLoaded = useIsFontLoaded(hit.family);
	const display = state$.display.get();
	const size = state$.size.get();

	// Change preview text if hit.defSubset is not latin or if it's an ico
	const isNotLatin =
		hit.defSubset !== 'latin' ||
		hit.category === 'icons' ||
		hit.category === 'other';

	// We want a unique preview text for each font if it's not latin
	const currentPreview$ = useComputed(() => {
		// If isNotLatin is true, update currentPreview to the correct preview text
		if (state$.preview.inputView.get() === '' && isNotLatin) {
			return getPreviewText(hit.defSubset, hit.objectID);
		}

		return state$.preview.value.get();
	});

	// Update the preview value to a language specific sentence
	// if the language is changed and preset is not custom
	state$.language.onChange((e) => {
		if (state$.preview.label.get() !== 'Custom') {
			state$.preview.value.set(getPreviewText(e.value, hit.objectID));
		}
	});

	return (
		<Box
			renderRoot={({ ...others }) => (
				<NavLink prefetch="intent" to={`/fonts/${hit.objectID}`} {...others} />
			)}
			className={classes.wrapper}
			mih={{ base: '150px', sm: display === 'grid' ? '332px' : '150px' }}
		>
			<link
				rel="stylesheet"
				href={`https://cdn.jsdelivr.net/fontsource/css/${hit.objectID}@latest/index.css`}
			/>
			<Skeleton visible={!isFontLoaded}>
				<Text
					fz={size}
					style={{ fontFamily: `"${hit.family}", "Fallback Outline"` }}
				>
					{currentPreview$.get()}
				</Text>
			</Skeleton>
			<Group className={classes['text-group']}>
				<Text fz={18} fw={700} component="span">
					{hit.family}
				</Text>
				{hit.variable && (
					<Text fz={15} fw={700} component="span">
						Variable
					</Text>
				)}
			</Group>
		</Box>
	);
});

interface HitsMapProps {
	hits: AlgoliaMetadata[];
	sentinelRef: React.MutableRefObject<HTMLDivElement | null>;
	state$: SearchState;
}

const HitsMap = ({ hits, sentinelRef, state$ }: HitsMapProps) => {
	return (
		<>
			{hits.map((hit) => (
				<HitComponent key={hit.objectID} state$={state$} hit={hit} />
			))}
			<div ref={sentinelRef} aria-hidden="true" key="sentinel" />
		</>
	);
};

const InfiniteHits = observer(({ state$ }: InfiniteHitsProps) => {
	const display = state$.display.get();

	// Infinite Scrolling
	const { results, indexUiState } = useInstantSearch();
	const { hits, isLastPage, showMore } = useInfiniteHits<AlgoliaMetadata>();
	const sentinelRef = useRef(null);

	useEffect(() => {
		if (sentinelRef.current !== null) {
			const observer = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !isLastPage) {
						showMore();
					}
				}
			});

			observer.observe(sentinelRef.current);

			return () => {
				observer.disconnect();
			};
		}
	}, [isLastPage, showMore]);

	// The `__isArtificial` flag makes sure to not display the No Results message
	// when no hits have been returned yet.
	if (!results.__isArtificial && results.nbHits === 0) {
		return (
			<Box>
				<Text>No results found for &quot;{indexUiState.query}&quot;</Text>
			</Box>
		);
	}

	return (
		<div id="hits">
			<Sort state$={state$} count={results.nbHits} />
			{display === 'grid' ? (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing={16}>
					<HitsMap state$={state$} hits={hits} sentinelRef={sentinelRef} />
				</SimpleGrid>
			) : (
				<SimpleGrid cols={{ base: 1 }} spacing={16}>
					<HitsMap state$={state$} hits={hits} sentinelRef={sentinelRef} />
				</SimpleGrid>
			)}
		</div>
	);
});

export { InfiniteHits };
