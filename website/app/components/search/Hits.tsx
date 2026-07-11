import { observer, useComputed } from '@legendapp/state/react';
import { Box, Group, SimpleGrid, Text, VisuallyHidden } from '@mantine/core';
import { useMounted, useViewportSize } from '@mantine/hooks';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch';
import { Link as NavLink } from 'react-router';

import { Skeleton } from '@/components/Skeleton';
import { useIsFontReady } from '@/hooks/useIsFontLoaded';
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

const hitsPerVirtualRow = 12;
const rowGap = 16;
const loadingPlaceholderKeys = [0, 1, 2, 3];
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

const HitComponent = observer(({ hit, state$ }: HitComponentProps) => {
	const stylesheetHref = `https://cdn.jsdelivr.net/fontsource/css/${hit.objectID}@latest/index.css`;

	// State to track if the font's CSS stylesheet has loaded.
	const [isStylesheetLoaded, setStylesheetLoaded] = useState(false);
	const isFontReady = useIsFontReady(hit.family, isStylesheetLoaded);

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
				onLoad={() => setStylesheetLoaded(true)}
				onError={() => setStylesheetLoaded(true)} // Also enable on error to prevent infinite skeleton.
			/>
			<Skeleton name="search-hit-preview" loading={!isFontReady}>
				<Text
					fz={size}
					mih={display === 'grid' ? getGridPreviewHeight(size) : undefined}
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

const HitPlaceholder = ({
	display,
	previewHeight,
}: LoadingPlaceholderProps) => (
	<Box
		className={`${classes.wrapper} ${classes.placeholder}`}
		mih={{ base: '150px', sm: display === 'grid' ? '332px' : '150px' }}
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

const InfiniteHits = observer(({ state$ }: InfiniteHitsProps) => {
	const display = state$.display.get();
	const loadingStatusId = useId();
	const resultsRootRef = useRef<HTMLDivElement | null>(null);
	const mounted = useMounted();
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [scrollMargin, setScrollMargin] = useState(0);
	const { width: viewportWidth } = useViewportSize();
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
	const { results, indexUiState, status } = useInstantSearch();
	const { items, isLastPage, showMore } = useInfiniteHits<AlgoliaMetadata>();
	const isSearchLoading = status === 'loading' || status === 'stalled';
	const size = state$.size.get();
	const gridPreviewHeight = getGridPreviewHeight(size);
	const previewValue = state$.preview.value.get();
	const searchKey = JSON.stringify({
		menu: indexUiState.menu ?? {},
		query: indexUiState.query ?? '',
		refinementList: indexUiState.refinementList ?? {},
		sortBy: indexUiState.sortBy ?? '',
		toggle: indexUiState.toggle ?? {},
	});
	const previousSearchKeyRef = useRef(searchKey);
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
	const showLoadingRow = !isLastPage && items.length > 0;
	const virtualRowCount = rows.length + (showLoadingRow ? 1 : 0);
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
	});
	const virtualRows = rowVirtualizer.getVirtualItems();
	const lastVirtualIndex = virtualRows[virtualRows.length - 1]?.index ?? -1;
	const measurementKey = `${searchKey}:${display}:${viewportWidth}:${size}:${previewValue}`;

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
		void measurementKey;
		rowVirtualizer.measure();
	}, [measurementKey, mounted, rowVirtualizer]);

	useEffect(() => {
		if (
			!mounted ||
			lastVirtualIndex < rows.length - 1 ||
			isLastPage ||
			isSearchLoading ||
			isLoadingMore
		) {
			return;
		}

		setIsLoadingMore(true);
		showMore();
	}, [
		mounted,
		isLastPage,
		isLoadingMore,
		isSearchLoading,
		lastVirtualIndex,
		rows.length,
		showMore,
	]);

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
		const resultsTop = resultsRootRef.current
			? resultsRootRef.current.getBoundingClientRect().top + window.scrollY
			: 0;
		window.scrollTo({
			top: Math.max(resultsTop - 16, 0),
			behavior: 'auto',
		});
	}, [searchKey]);

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
											{row.map((hit) => (
												<HitComponent
													key={hit.objectID}
													state$={state$}
													hit={hit}
												/>
											))}
										</div>
									) : (
										<LoadingRow
											display={display}
											previewHeight={gridPreviewHeight}
										/>
									)}
								</div>
							);
						})}
					</div>
				) : (
					<SimpleGrid
						cols={display === 'grid' ? { base: 1, sm: 2, md: 3, xl: 4 } : 1}
						spacing={rowGap}
					>
						{items.map((hit) => (
							<HitComponent key={hit.objectID} state$={state$} hit={hit} />
						))}
					</SimpleGrid>
				)}
			</div>
		</div>
	);
});

export { InfiniteHits };
