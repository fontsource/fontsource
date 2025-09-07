import { observer, useComputed } from '@legendapp/state/react';
import { Box, Group, SimpleGrid, Skeleton, Text } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch';
import { Link as NavLink } from 'react-router';

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

// Global cache to track loaded stylesheets and avoid redundant checks.
const loadedStylesheetsCache = new Set<string>();

function useInfiniteScroll(isLastPage: boolean, showMore: () => void) {
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	const handleIntersection = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			for (const entry of entries) {
				if (entry.isIntersecting && !isLastPage) {
					showMore();
				}
			}
		},
		[isLastPage, showMore],
	);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(handleIntersection);
		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, [handleIntersection]);

	return sentinelRef;
}

const HitComponent = observer(({ hit, state$ }: HitComponentProps) => {
	const stylesheetHref = `https://cdn.jsdelivr.net/fontsource/css/${hit.objectID}@latest/index.css`;

	// State to track if the font's CSS stylesheet has loaded.
	const [isStylesheetLoaded, setStylesheetLoaded] = useState(false);
	const isFontLoaded = useIsFontLoaded(hit.family, isStylesheetLoaded);

	// Memoized check to prevent expensive DOM operations on every render.
	const isStylesheetAlreadyLoaded = useMemo(() => {
		if (typeof document === 'undefined') {
			return false;
		}

		if (loadedStylesheetsCache.has(stylesheetHref)) {
			return true;
		}

		for (const sheet of document.styleSheets) {
			if (sheet.href === stylesheetHref) {
				loadedStylesheetsCache.add(stylesheetHref);
				return true;
			}
		}
		return false;
	}, [stylesheetHref]);

	useEffect(() => {
		if (isStylesheetLoaded) {
			return;
		}

		if (isStylesheetAlreadyLoaded) {
			setStylesheetLoaded(true);
		}
	}, [isStylesheetLoaded, isStylesheetAlreadyLoaded]);

	const display = state$.display.get();
	const size = state$.size.get();

	// Change preview text if hit.defSubset is not latin or if it's an ico
	const isNotLatin =
		hit.defSubset !== 'latin' ||
		hit.category === 'icons' ||
		hit.category === 'other';

	// We want a unique preview text for each font if it's not latin
	const currentPreview$ = useComputed(() => {
		const previewValue = state$.preview.value.get();
		const inputView = state$.preview.inputView.get();

		// Use language-specific preview for non-latin fonts when no custom input
		if (inputView === '' && isNotLatin) {
			return getPreviewText(hit.defSubset, hit.objectID);
		}

		return previewValue;
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
				href={stylesheetHref}
				onLoad={() => {
					loadedStylesheetsCache.add(stylesheetHref);
					setStylesheetLoaded(true);
				}}
				onError={() => setStylesheetLoaded(true)} // Also enable on error to prevent infinite skeleton.
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

const InfiniteHits = observer(({ state$ }: InfiniteHitsProps) => {
	const display = state$.display.get();

	// Infinite Scrolling
	const { results, indexUiState } = useInstantSearch();
	const { items, isLastPage, showMore } = useInfiniteHits<AlgoliaMetadata>();

	const sentinelRef = useInfiniteScroll(isLastPage, showMore);

	useEffect(() => {
		const unsubscribe = state$.language.onChange((e) => {
			if (state$.preview.label.get() !== 'Custom') {
				// For global preview updates, use the first hit or a default
				const firstHit = items[0];
				if (firstHit) {
					const newPreview = getPreviewText(e.value, firstHit.objectID);
					state$.preview.value.set(newPreview);
				}
			}
		});

		return unsubscribe;
	}, [state$.preview, state$.language, items]);

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
					{items.map((item) => (
						<HitComponent key={item.objectID} state$={state$} hit={item} />
					))}
					<div ref={sentinelRef} aria-hidden="true" />
				</SimpleGrid>
			) : (
				<SimpleGrid cols={{ base: 1 }} spacing={16}>
					{items.map((item) => (
						<HitComponent key={item.objectID} state$={state$} hit={item} />
					))}
					<div ref={sentinelRef} aria-hidden="true" />
				</SimpleGrid>
			)}
		</div>
	);
});

export { InfiniteHits };
