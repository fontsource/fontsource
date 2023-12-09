import { useSelector } from '@legendapp/state/react';
import { Box, Group, SimpleGrid, Skeleton, Text } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch';

import { useIsFontLoaded } from '@/hooks/useIsFontLoaded';
import { getPreviewText } from '@/utils/language/language';
import type { AlgoliaMetadata } from '@/utils/types';

import classes from './Hits.module.css';
import { display, previewValue, size } from './observables';
import { Sort } from './Sort';

interface Hit {
	hit: AlgoliaMetadata;
}

interface HitComponentProps extends Hit {
	fontSize: number;
}

const HitComponent = ({ hit, fontSize }: HitComponentProps) => {
	const displaySelect = useSelector(display);

	const isFontLoaded = useIsFontLoaded(hit.family);

	// Change preview text if hit.defSubset is not latin or if it's an icon
	const previewValueSelect = useSelector(previewValue);
	const isNotLatin =
		hit.defSubset !== 'latin' ||
		hit.category === 'icons' ||
		hit.category === 'other';

	const [currentPreview, setCurrentPreview] = useState(previewValueSelect);

	// If previewValue changes, update currentPreview
	useEffect(() => {
		setCurrentPreview(previewValueSelect);
	}, [previewValueSelect]);

	// If isNotLatin is true, update currentPreview to the correct preview text
	useEffect(() => {
		if (isNotLatin) {
			setCurrentPreview(getPreviewText(hit.defSubset, hit.objectID));
		}
	}, [isNotLatin, hit.defSubset, hit.objectID]);

	return (
		<Box
			component="a"
			href={`/fonts/${hit.objectID}`}
			className={classes.wrapper}
			mih={{ base: '150px', sm: displaySelect === 'grid' ? '332px' : '150px' }}
		>
			<link
				rel="stylesheet"
				href={`https://r2.fontsource.org/css/${hit.objectID}@latest/index.css`}
			/>
			<Skeleton visible={!isFontLoaded}>
				<Text fz={fontSize} style={{ fontFamily: `"${hit.family}"` }}>
					{currentPreview}
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
};

interface HitsMapProps {
	hits: ReturnType<typeof useInfiniteHits>['hits'];
	sentinelRef: React.MutableRefObject<HTMLDivElement | null>;
}

const HitsMap = ({ hits, sentinelRef }: HitsMapProps) => {
	const sizeSelect = useSelector(size);

	return (
		<>
			{hits.map((hit) => (
				<HitComponent
					key={hit.objectID}
					// @ts-expect-error - hit prop is messed up cause of Algolia
					hit={hit}
					fontSize={sizeSelect}
				/>
			))}
			<div ref={sentinelRef} aria-hidden="true" key="sentinel" />
		</>
	);
};

const InfiniteHits = () => {
	const displaySelect = useSelector(display);

	// Infinite Scrolling
	const { results, indexUiState } = useInstantSearch();
	const { hits, isLastPage, showMore } = useInfiniteHits();
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
		<Box>
			<Sort count={results.nbHits} />
			{displaySelect === 'grid' ? (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing={16}>
					<HitsMap hits={hits} sentinelRef={sentinelRef} />
				</SimpleGrid>
			) : (
				<SimpleGrid cols={{ base: 1 }} spacing={16}>
					<HitsMap hits={hits} sentinelRef={sentinelRef} />
				</SimpleGrid>
			)}
		</Box>
	);
};

export { InfiniteHits };
