import { useSelector } from '@legendapp/state/react';
import {
	Box,
	createStyles,
	Group,
	rem,
	SimpleGrid,
	Skeleton,
	Text,
} from '@mantine/core';
import { useFetcher } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import {
	useInfiniteHits,
	useInstantSearch,
} from 'react-instantsearch-hooks-web';

import { useIsFontLoaded } from '@/hooks/useIsFontLoaded';
import { useLoadFont } from '@/hooks/useLoadFont';
import type { AlgoliaMetadata } from '@/utils/types';

import { display, previewValue, size } from './observables';
import { Sort } from './Sort';

interface Hit {
	hit: AlgoliaMetadata;
}

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		width: '100%',
		flexDirection: 'column',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		padding: rem(24),
		marginLeft: 'auto',
		marginRight: 'auto',
		overflowWrap: 'anywhere',

		border: `${rem(1)} solid ${
			theme.colorScheme === 'dark'
				? theme.colors.border[1]
				: theme.colors.border[0]
		}`,
		borderRadius: '4px',

		// Remove a tag hyperlink styles
		color: 'inherit',
		textDecoration: 'inherit',

		transition: 'transform 150ms ease-in-out',
		'&:hover': {
			color:
				theme.colorScheme === 'dark'
					? theme.colors.purple[1]
					: theme.colors.purple[0],
			border: `${rem(1)} solid ${
				theme.colorScheme === 'dark'
					? theme.colors.purple[1]
					: theme.colors.purple[0]
			}`,

			boxShadow: '0 0 5px 0 rgba(0, 0, 0, 0.10)',
			transform: 'scale(1.005)',
		},
	},

	textGroup: {
		paddingTop: rem(16),
		width: '100%',
	},
}));

interface HitComponentProps extends Hit {
	fontSize: number;
}
const HitComponent = ({ hit, fontSize }: HitComponentProps) => {
	const { classes } = useStyles();
	const displaySelect = useSelector(display);

	const isFontLoaded = useIsFontLoaded(hit.family);

	// Change preview text if hit.defSubset is not latin or if it's an icon
	const previewValueSelect = useSelector(previewValue);
	const [currentPreview, setCurrentPreview] = useState(previewValueSelect);
	const previewFetcher = useFetcher();
	const isNotLatin =
		hit.defSubset !== 'latin' ||
		hit.category === 'icons' ||
		hit.category === 'other';
	useEffect(() => {
		if (
			isNotLatin &&
			previewFetcher.state === 'idle' &&
			!previewFetcher.data?.text
		) {
			previewFetcher.submit(
				{ id: hit.objectID, subset: hit.defSubset },
				{ method: 'POST', action: '/actions/language' },
			);
		}

		if (previewFetcher.state === 'idle' && previewFetcher.data?.text) {
			setCurrentPreview(previewFetcher.data.text);
		}
	}, [previewFetcher, isNotLatin, hit.objectID, hit.defSubset]);

	// If previewValue changes, update currentPreview
	useEffect(() => {
		setCurrentPreview(previewValueSelect);
	}, [previewValueSelect]);

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
				<Text size={fontSize} style={{ fontFamily: `"${hit.family}"` }}>
					{currentPreview}
				</Text>
			</Skeleton>
			<Group className={classes.textGroup} position="apart">
				<Text size={18} weight={700} component="span">
					{hit.family}
				</Text>
				{hit.variable && (
					<Text size={15} weight={700} component="span">
						Variable
					</Text>
				)}
			</Group>
		</Box>
	);
};

const InfiniteHits = () => {
	const sizeSelect = useSelector(size);
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
				<Text>No results found for "{indexUiState.query}"</Text>
			</Box>
		);
	}

	return (
		<Box>
			<Sort count={results.nbHits} />
			<SimpleGrid
				breakpoints={
					displaySelect === 'grid'
						? [
								{ minWidth: 'xl', cols: 4, spacing: 16 },
								{ minWidth: 'md', cols: 3, spacing: 16 },
								{ minWidth: 'sm', cols: 2, spacing: 16 },
								{ minWidth: 0, cols: 1, spacing: 16 },
						  ]
						: [{ minWidth: 0, cols: 1, spacing: 16 }]
				}
			>
				{hits.map((hit) => (
					<HitComponent
						key={hit.objectID}
						// @ts-expect-error - hit prop is messed up cause of Algolia
						hit={hit}
						fontSize={sizeSelect}
					/>
				))}
				<div ref={sentinelRef} aria-hidden="true" key="sentinel" />
			</SimpleGrid>
		</Box>
	);
};

export { InfiniteHits };
