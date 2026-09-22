import { observer, useValue } from '@legendapp/state/react';
import { Box, Button, Group, Stack, Text, VisuallyHidden } from '@mantine/core';
import {
	useWindowVirtualizer,
	type VirtualItem,
} from '@tanstack/react-virtual';
import type { BaseHit } from 'instantsearch.js';
import type { InfiniteHitsCache } from 'instantsearch.js/es/connectors/infinite-hits/connectInfiniteHits';
import { isEqual } from 'instantsearch.js/es/lib/utils/isEqual';
import {
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch';
import { FontCard } from '@/components/FontCard';
import { Skeleton } from '@/components/Skeleton';
import { useCollectionsStore } from '@/features/collections/CollectionsProvider';
import type { ListRegistryLanguagesResponse } from '@/generated/api';
import type { FontPreview } from '@/utils/font-summary';
import {
	getPreviewText,
	getRecommendedPreviewLanguage,
	getRecommendedPreviewText,
} from '@/utils/language/language';

import classes from './Hits.module.css';
import type { SearchState } from './observables';
import { Sort } from './Sort';

interface AlgoliaMetadata extends BaseHit {
	objectID: string;
	family: string;
	defSubset: string;
	category: string;
	variable: boolean;
}

interface HitComponentProps {
	languageSample?: string;
	languages: ListRegistryLanguagesResponse;
	previewLanguageId?: string;
	preview?: FontPreview;
	state$: SearchState;
	hit: AlgoliaMetadata;
	eagerStylesheet?: boolean;
}

interface InfiniteHitsProps {
	languages: ListRegistryLanguagesResponse;
	previews: Record<string, FontPreview>;
	state$: SearchState;
}

const hitsPerVirtualRow = 12;
const eagerStylesheetCount = 4;
const rowGap = 16;
const loadingPlaceholderKeys = [0, 1, 2, 3];
// Keep loaded pages across route changes, but not across SSR requests or reloads.
let cachedHits:
	| Parameters<InfiniteHitsCache<AlgoliaMetadata>['write']>[0]
	| null = null;
const hitsCache: InfiniteHitsCache<AlgoliaMetadata> = {
	read({ state: { page: _page, ...state } }) {
		if (typeof window === 'undefined') return null;
		return cachedHits && isEqual(cachedHits.state, state)
			? cachedHits.hits
			: null;
	},
	write({ state: { page: _page, ...state }, hits }) {
		if (typeof window !== 'undefined') cachedHits = { state, hits };
	},
};
let cachedMeasurements: { key: string; rows: VirtualItem[] } | undefined;

const subscribeToViewport = (onChange: () => void) => {
	window.addEventListener('resize', onChange);
	return () => window.removeEventListener('resize', onChange);
};
type Display = 'grid' | 'list';
interface LoadingPlaceholderProps {
	display: Display;
	previewHeight: number;
}

const getGridPreviewHeight = (size: number) => Math.ceil(size * 1.55 * 3);

const getRowClassName = (display: Display) =>
	display === 'list'
		? `${classes['result-row']} ${classes['list-mode']}`
		: classes['result-row'];

const getNoResultsMessage = (
	collectionMessage: string | undefined,
	hasQuery: boolean,
	hasActiveFilters: boolean,
) => {
	if (collectionMessage) return collectionMessage;
	if (hasQuery && hasActiveFilters) {
		return 'No font families match your search and filters. Try a different search or remove a filter.';
	}
	if (hasQuery) {
		return 'No font families match your search. Try a different search.';
	}
	if (hasActiveFilters) {
		return 'No font families match these filters. Try removing a filter.';
	}
	return 'No font families are available right now.';
};

const HitComponent = observer(
	({
		eagerStylesheet,
		hit,
		state$,
		preview,
		languageSample,
		languages,
		previewLanguageId,
	}: HitComponentProps) => {
		const display = useValue(state$.display);
		const size = useValue(state$.size);

		// Change preview text if hit.defSubset is not latin or if it's an ico
		const isNotLatin =
			hit.defSubset !== 'latin' ||
			hit.category === 'icons' ||
			hit.category === 'other';

		// We want a unique preview text for each font if it's not latin
		const currentPreview = useValue(() => {
			const customValue = state$.preview.customValue.get();

			if (customValue !== '') {
				return customValue;
			}

			if (languageSample) return languageSample;

			// Use language-specific preview for non-latin fonts when no custom input
			if (
				preview?.sampleText ||
				preview?.previewSubset ||
				getRecommendedPreviewLanguage(
					{ ...hit, ...preview },
					languages ?? [],
				) ||
				isNotLatin
			) {
				return getRecommendedPreviewText(
					{ ...hit, ...preview },
					'short',
					languages,
				);
			}

			return state$.preview.presetValue.get();
		});

		return (
			<FontCard
				font={{
					...preview,
					id: hit.objectID,
					family: hit.family,
					defSubset: hit.defSubset,
					category: hit.category,
					variable: hit.variable,
				}}
				layout={display}
				preview={currentPreview}
				languages={languages}
				previewLanguageId={previewLanguageId}
				previewHeight={getGridPreviewHeight(size)}
				size={size}
				eagerStylesheet={eagerStylesheet}
			/>
		);
	},
);

const HitPlaceholder = ({
	display,
	previewHeight,
}: LoadingPlaceholderProps) => (
	<Box
		className={`${classes.wrapper} ${classes.placeholder}`}
		data-layout={display}
		aria-hidden="true"
	>
		<Skeleton name="search-hit-preview" loading>
			<div
				className={classes['placeholder-preview']}
				style={{ height: display === 'grid' ? previewHeight : 42 }}
			>
				Loading font preview
			</div>
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

const LoadingRow = ({ display, previewHeight }: LoadingPlaceholderProps) => (
	<div className={getRowClassName(display)} aria-hidden="true">
		{loadingPlaceholderKeys.map((key) => (
			<HitPlaceholder
				key={key}
				display={display}
				previewHeight={previewHeight}
			/>
		))}
	</div>
);

const InfiniteHits = observer((props: InfiniteHitsProps) => {
	const { state$, previews, languages } = props;
	const collectionsStore = useCollectionsStore();
	const collectionId = useValue(state$.collectionId);
	const collections = useValue(collectionsStore.getCollections);
	const collection = collections.find((item) => item.id === collectionId);
	const collectionMessage = collection
		? collection.fontIds.length === 0
			? `${collection.name} is empty. Choose All fonts to find fonts to add.`
			: `No font families in ${collection.name} match these filters. Try removing a filter.`
		: undefined;
	const display = state$.display.get();
	const loadingStatusId = useId();
	const resultsRootRef = useRef<HTMLDivElement | null>(null);
	const [loadMoreElement, setLoadMoreElement] = useState<HTMLDivElement | null>(
		null,
	);
	// Match SSR during hydration, but virtualize immediately on client navigation.
	const viewportWidth = useSyncExternalStore(
		subscribeToViewport,
		() => window.innerWidth,
		() => 0,
	);
	const mounted = viewportWidth > 0;
	const [scrollMargin, setScrollMargin] = useState(0);
	const columns =
		display === 'list'
			? 1
			: viewportWidth >= 1408
				? 4
				: viewportWidth >= 992
					? 3
					: viewportWidth >= 768
						? 2
						: 1;

	// Infinite Scrolling
	const { indexUiState, refresh, results, status } = useInstantSearch({
		catchError: true,
	});
	const [requestedResults, setRequestedResults] = useState<
		typeof results | null
	>(null);
	const isLoadingMore = requestedResults === results && status !== 'error';
	const { items, isLastPage, showMore } = useInfiniteHits<AlgoliaMetadata>({
		cache: hitsCache,
	});
	const isSearchLoading = status === 'loading' || status === 'stalled';
	const size = state$.size.get();
	const gridPreviewHeight = getGridPreviewHeight(size);
	const previewValue =
		state$.preview.customValue.get() || state$.preview.presetValue.get();
	const searchKey = JSON.stringify({
		collectionId,
		menu: indexUiState.menu ?? {},
		query: indexUiState.query ?? '',
		refinementList: indexUiState.refinementList ?? {},
		sortBy: indexUiState.sortBy ?? '',
		toggle: indexUiState.toggle ?? {},
	});
	const selectedLanguage = languages.find(
		(language) => language.id === indexUiState.refinementList?.languageIds?.[0],
	);
	const languageSample =
		selectedLanguage?.sampleText?.short || selectedLanguage?.sampleText?.long;
	const hasQuery = Boolean(indexUiState.query?.trim());
	const hasActiveFilters =
		Object.values(indexUiState.menu ?? {}).some(Boolean) ||
		Object.values(indexUiState.refinementList ?? {}).some(
			(values) => values.length > 0,
		) ||
		Object.values(indexUiState.toggle ?? {}).some(Boolean);
	// Twelve fills complete rows at every supported grid width: 1, 2, 3, and 4 columns.
	const rows = useMemo(
		() =>
			Array.from(
				{ length: Math.ceil(items.length / hitsPerVirtualRow) },
				(_, index) =>
					items.slice(
						index * hitsPerVirtualRow,
						(index + 1) * hitsPerVirtualRow,
					),
			),
		[items],
	);
	const showLoadingRow = !isLastPage && items.length > 0 && status !== 'error';
	const virtualRowCount = rows.length + (showLoadingRow ? 1 : 0);
	const measurementKey = `${searchKey}:${display}:${viewportWidth}:${size}:${previewValue}`;
	const previousMeasurementKey = useRef(measurementKey);
	const rowVirtualizer = useWindowVirtualizer<HTMLDivElement>({
		count: mounted ? virtualRowCount : 0,
		enabled: mounted,
		estimateSize: (index) => {
			const itemCount =
				index === rows.length
					? loadingPlaceholderKeys.length
					: hitsPerVirtualRow;
			const visualRows = Math.ceil(itemCount / columns);
			const cardHeight = display === 'list' ? 150 : columns === 1 ? 260 : 332;
			return visualRows * cardHeight + Math.max(visualRows - 1, 0) * rowGap;
		},
		gap: rowGap,
		getItemKey: (index) => rows[index]?.[0]?.objectID ?? 'loading-row',
		overscan: 2,
		scrollMargin,
		useAnimationFrameWithResizeObserver: true,
		// Restore measured row sizes before Back navigation restores the scroll position.
		initialMeasurementsCache:
			cachedMeasurements?.key === measurementKey
				? cachedMeasurements.rows
				: undefined,
	});
	const virtualRows = rowVirtualizer.getVirtualItems();

	// biome-ignore lint/correctness/useExhaustiveDependencies: viewport changes can move the results below responsive controls.
	useLayoutEffect(() => {
		if (!mounted || !resultsRootRef.current) return;

		const nextScrollMargin = Math.round(
			resultsRootRef.current.getBoundingClientRect().top + window.scrollY,
		);
		setScrollMargin((current) =>
			current === nextScrollMargin ? current : nextScrollMargin,
		);
	}, [mounted, viewportWidth]);

	useLayoutEffect(() => {
		if (!mounted) return;
		if (previousMeasurementKey.current !== measurementKey) {
			rowVirtualizer.measure();
		}
		previousMeasurementKey.current = measurementKey;
		return () => {
			cachedMeasurements = {
				key: measurementKey,
				rows: rowVirtualizer.takeSnapshot(),
			};
		};
	}, [measurementKey, mounted, rowVirtualizer]);

	useEffect(() => {
		if (!loadMoreElement || isLastPage || status !== 'idle' || isLoadingMore) {
			return;
		}

		// Rendering overscan can be several screens ahead; fetch near the viewport.
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				setRequestedResults(results);
				showMore();
			},
			{ rootMargin: '400px 0px' },
		);
		observer.observe(loadMoreElement);
		return () => observer.disconnect();
	}, [isLastPage, isLoadingMore, loadMoreElement, showMore, results, status]);

	useEffect(() => {
		const unsubscribe = state$.language.onChange((e) => {
			// Keep the preset current while custom text is active so clearing it
			// immediately restores the selected language preview.
			state$.preview.presetValue.set(getPreviewText(e.value));
		});

		return unsubscribe;
	}, [state$.preview, state$.language]);

	const searchError = status === 'error' && (
		<Box px={4} py={24} role="alert">
			<Stack align="flex-start" gap="xs">
				<Text fw={600}>Font results could not load.</Text>
				<Text c="dimmed">
					We could not reach the font search service. Check your connection,
					then try again.
				</Text>
				<Button onClick={() => refresh()} size="sm">
					Try again
				</Button>
			</Stack>
		</Box>
	);
	if (searchError && items.length === 0) return searchError;

	// The `__isArtificial` flag makes sure to not display the No Results message
	// when no hits have been returned yet.
	if (status !== 'error' && !results.__isArtificial && results.nbHits === 0) {
		return (
			<Box>
				<Text aria-atomic="true" role="status">
					{getNoResultsMessage(collectionMessage, hasQuery, hasActiveFilters)}
				</Text>
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
			<div
				ref={resultsRootRef}
				aria-busy={isSearchLoading || isLoadingMore}
				aria-describedby={isLoadingMore ? loadingStatusId : undefined}
			>
				{mounted ? (
					<div
						className={classes['virtual-list']}
						style={{ height: rowVirtualizer.getTotalSize() }}
					>
						{virtualRows.map((virtualRow) => {
							const row = rows[virtualRow.index];
							return (
								<div
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={rowVirtualizer.measureElement}
									className={classes['virtual-row']}
									style={{
										transform: `translateY(${virtualRow.start - scrollMargin}px)`,
									}}
								>
									{row ? (
										<div className={getRowClassName(display)}>
											{row.map((hit, hitIndex) => (
												<HitComponent
													languageSample={languageSample}
													languages={languages}
													previewLanguageId={selectedLanguage?.id}
													key={hit.objectID}
													state$={state$}
													hit={hit}
													preview={previews[hit.objectID]}
													eagerStylesheet={
														virtualRow.index === 0 &&
														hitIndex < eagerStylesheetCount
													}
												/>
											))}
										</div>
									) : (
										<div ref={setLoadMoreElement}>
											<LoadingRow
												display={display}
												previewHeight={gridPreviewHeight}
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				) : (
					<div className={classes['initial-results']} data-layout={display}>
						{items.map((hit, index) => (
							<HitComponent
								languageSample={languageSample}
								languages={languages}
								previewLanguageId={selectedLanguage?.id}
								key={hit.objectID}
								state$={state$}
								hit={hit}
								preview={previews[hit.objectID]}
								eagerStylesheet={index < eagerStylesheetCount}
							/>
						))}
					</div>
				)}
			</div>
			{searchError}
		</div>
	);
});

export { InfiniteHits };
