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
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import {
	useInfiniteHits,
	useInstantSearch,
} from 'react-instantsearch-hooks-web';
import useFontFaceObserver from 'use-font-face-observer';

import type { AlgoliaMetadata } from '@/utils/types';

import { displayAtom, previewValueAtom, sizeAtom } from './atoms';
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
	previewText: string;
}
const HitComponent = ({ hit, fontSize, previewText }: HitComponentProps) => {
	const { classes } = useStyles();
	const fontCss = useFetcher();
	const [display] = useAtom(displayAtom);
	// useFetcher only knows when the CSS is loaded, but not the font files themselves
	const isFontLoaded = useFontFaceObserver(
		[
			{
				family: hit.family,
			},
		],
		{ timeout: 7500 }
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (fontCss.type === 'init') {
			fontCss.load(`/fonts/${hit.objectID}/fetch-css`);
		}

		if (fontCss.type === 'done') {
			const style = document.createElement('style');
			style.textContent = fontCss.data.css;
			document.head.appendChild(style);
		}

		if (fontCss.type === 'done' && isFontLoaded) {
			// Give browser time to load fonts in order to not cause a flash of unstyled font
			setLoading(false);
		}
	}, [fontCss, hit.objectID, isFontLoaded]);

	return (
		<Box
			component="a"
			href={`/fonts/${hit.objectID}`}
			className={classes.wrapper}
			mih={{ base: '150px', sm: display == 'grid' ? '332px' : '150px' }}
		>
			<Skeleton visible={loading}>
				<Text size={fontSize} style={{ fontFamily: hit.family }}>
					{previewText}
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
	const [previewValue] = useAtom(previewValueAtom);
	const [size] = useAtom(sizeAtom);
	const [display] = useAtom(displayAtom);

	// Infinite Scrolling
	const { results, indexUiState } = useInstantSearch();
	const { hits, isLastPage, showMore } = useInfiniteHits();
	const sentinelRef = useRef(null);

	useEffect(() => {
		if (sentinelRef.current !== null) {
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isLastPage) {
						showMore();
					}
				});
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
					display == 'grid'
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
						// @ts-ignore - hit prop is messed up cause of Algolia
						hit={hit}
						previewText={previewValue}
						fontSize={size}
					/>
				))}
				<div ref={sentinelRef} aria-hidden="true" key="sentinel" />
			</SimpleGrid>
		</Box>
	);
};

export { InfiniteHits };
