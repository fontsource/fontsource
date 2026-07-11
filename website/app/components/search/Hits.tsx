import { observer, useComputed } from '@legendapp/state/react';
import { Box, Group, Text, VisuallyHidden } from '@mantine/core';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch';
import { Link as NavLink } from 'react-router';
import { VirtuosoGrid } from 'react-virtuoso';
import type {
	GridComponents,
	GridScrollSeekPlaceholderProps,
	ScrollSeekConfiguration,
} from 'react-virtuoso';

import { Skeleton } from '@/components/Skeleton';
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

const placeholderKeys = Array.from(
	{ length: 8 },
	(_, index) => `loading-hit-${index}`,
);
const loadAhead = { top: 0, bottom: 1200 };
const scrollSeek: ScrollSeekConfiguration = {
	enter: (velocity) => Math.abs(velocity) > 1200,
	exit: (velocity) => Math.abs(velocity) < 120,
};

type GridContext = {
	display: 'grid' | 'list';
	showPlaceholders: boolean;
};

const getItemKey = (_index: number, hit: AlgoliaMetadata) => hit.objectID;

const HitComponent = observer(({ hit, state$ }: HitComponentProps) => {
	const stylesheetHref = `https://cdn.jsdelivr.net/fontsource/css/${hit.objectID}@latest/index.css`;

	// State to track if the font's CSS stylesheet has loaded.
	const [isStylesheetLoaded, setStylesheetLoaded] = useState(false);
	const isFontLoaded = useIsFontLoaded(hit.family, isStylesheetLoaded);

	useEffect(() => {
		if (isStylesheetLoaded) {
			return;
		}

		for (const sheet of document.styleSheets) {
			if (sheet.href === stylesheetHref) {
				setStylesheetLoaded(true);
				return;
			}
		}
	}, [isStylesheetLoaded, stylesheetHref]);

	const display = state$.display.get();
	const previewSize = state$.size.get();

	const needsDefaultPreview =
		hit.defSubset !== 'latin' ||
		hit.category === 'icons' ||
		hit.category === 'other';

	const previewText$ = useComputed(() => {
		const previewValue = state$.preview.value.get();
		const inputView = state$.preview.inputView.get();

		if (inputView === '' && needsDefaultPreview) {
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
				onLoad={() => setStylesheetLoaded(true)}
				onError={() => setStylesheetLoaded(true)} // Also enable on error to prevent infinite skeleton.
			/>
			<Skeleton name="search-hit-preview" loading={!isFontLoaded}>
				<Text
					fz={previewSize}
					style={{ fontFamily: `"${hit.family}", "Fallback Outline"` }}
				>
					{previewText$.get()}
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

const HitPlaceholder = ({ display }: { display: 'grid' | 'list' }) => (
	<Box
		className={`${classes.wrapper} ${classes.placeholder}`}
		mih={{ base: '150px', sm: display === 'grid' ? '332px' : '150px' }}
		aria-hidden="true"
	>
		<Skeleton name="search-hit-preview" loading>
			<div className={classes['placeholder-preview']}>Loading font preview</div>
		</Skeleton>
		<Group className={classes['text-group']}>
			<Skeleton name="font-preview-row" loading>
				<div className={classes['placeholder-metadata']}>
					Loading font metadata
				</div>
			</Skeleton>
		</Group>
	</Box>
);

const ScrollSeekPlaceholder = ({
	context,
}: GridScrollSeekPlaceholderProps & { context: GridContext }) => (
	<HitPlaceholder display={context.display} />
);

const LoadingFooter = ({ context }: { context: GridContext }) => {
	if (!context.showPlaceholders) {
		return null;
	}

	const className =
		context.display === 'grid'
			? `${classes['results-list']} ${classes['grid-mode']} ${classes['placeholder-footer']}`
			: `${classes['results-list']} ${classes['placeholder-footer']}`;

	return (
		<div className={className} aria-hidden="true">
			{placeholderKeys.map((key) => (
				<div key={key} className={classes['result-item']}>
					<HitPlaceholder display={context.display} />
				</div>
			))}
		</div>
	);
};

const gridComponents: GridComponents<GridContext> = {
	Footer: LoadingFooter,
	ScrollSeekPlaceholder,
};

const InfiniteHits = observer(({ state$ }: InfiniteHitsProps) => {
	const display = state$.display.get();
	const loadingStatusId = useId();
	const virtuosoRootRef = useRef<HTMLElement | null>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// Infinite Scrolling
	const { results, indexUiState, status } = useInstantSearch();
	const { items, isLastPage, showMore } = useInfiniteHits<AlgoliaMetadata>();
	const isSearchLoading = status === 'loading' || status === 'stalled';
	const firstHitId = items[0]?.objectID ?? '';
	const searchKey = JSON.stringify({
		menu: indexUiState.menu ?? {},
		query: indexUiState.query ?? '',
		refinementList: indexUiState.refinementList ?? {},
		sortBy: indexUiState.sortBy ?? '',
		toggle: indexUiState.toggle ?? {},
	});
	const previousSearchKeyRef = useRef(searchKey);
	const listClassName =
		display === 'grid'
			? `${classes['results-list']} ${classes['grid-mode']}`
			: classes['results-list'];

	const renderItem = useCallback(
		(_index: number, hit: AlgoliaMetadata) => (
			<HitComponent state$={state$} hit={hit} />
		),
		[state$],
	);

	const requestMore = useCallback(() => {
		if (typeof window === 'undefined' || isLastPage || isSearchLoading) {
			return;
		}

		setIsLoadingMore(true);
		showMore();
	}, [isLastPage, isSearchLoading, showMore]);

	useEffect(() => {
		if (!isSearchLoading) {
			setIsLoadingMore(false);
		}
	}, [isSearchLoading]);

	useEffect(() => {
		if (previousSearchKeyRef.current === searchKey) {
			return;
		}

		previousSearchKeyRef.current = searchKey;
		setIsLoadingMore(false);
		window.scrollTo({
			top: Math.max((virtuosoRootRef.current?.offsetTop ?? 0) - 16, 0),
			behavior: 'auto',
		});
	}, [searchKey]);

	useEffect(() => {
		const unsubscribe = state$.language.onChange((e) => {
			if (state$.preview.label.get() === 'Custom') {
				return;
			}

			if (firstHitId !== '') {
				state$.preview.value.set(getPreviewText(e.value, firstHitId));
			}
		});

		return unsubscribe;
	}, [state$.preview, state$.language, firstHitId]);

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
			{isLoadingMore && (
				<VisuallyHidden id={loadingStatusId} role="status">
					Loading more font families
				</VisuallyHidden>
			)}
			<VirtuosoGrid
				key={searchKey}
				aria-busy={isSearchLoading || isLoadingMore}
				aria-describedby={isLoadingMore ? loadingStatusId : undefined}
				components={gridComponents}
				computeItemKey={getItemKey}
				context={{
					display,
					showPlaceholders: !isLastPage && items.length > 0,
				}}
				data={items}
				endReached={requestMore}
				increaseViewportBy={loadAhead}
				initialItemCount={Math.min(items.length, results.hitsPerPage)}
				itemClassName={classes['result-item']}
				itemContent={renderItem}
				listClassName={listClassName}
				scrollerRef={(ref) => {
					virtuosoRootRef.current = ref;
				}}
				scrollSeekConfiguration={scrollSeek}
				useWindowScroll
			/>
		</div>
	);
});

export { InfiniteHits };
