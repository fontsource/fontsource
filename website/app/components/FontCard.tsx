import { Box, Group, Text } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';

import { useIsFontReady } from '@/hooks/useIsFontLoaded';
import type { FontSummary } from '@/utils/font-summary';
import { getPreviewText } from '@/utils/language/language';
import classes from './FontCard.module.css';
import { Skeleton } from './Skeleton';

interface FontCardProps {
	font: FontSummary;
	layout?: 'grid' | 'list';
	preview?: string;
	previewHeight?: number;
	size: number;
	eagerStylesheet?: boolean;
}

const FontCard = ({
	font,
	layout = 'grid',
	preview,
	previewHeight,
	size,
	eagerStylesheet = false,
}: FontCardProps) => {
	const location = useLocation();
	const stylesheetHref = `https://cdn.jsdelivr.net/fontsource/css/${font.id}@latest/index.css`;
	const { ref, entry } = useIntersection<HTMLDivElement>({
		rootMargin: '150% 0px',
	});
	const [shouldLoadStylesheet, setShouldLoadStylesheet] =
		useState(eagerStylesheet);
	const [isStylesheetLoaded, setStylesheetLoaded] = useState(false);
	const isFontReady = useIsFontReady(font.family, isStylesheetLoaded);

	useEffect(() => {
		if (eagerStylesheet || entry?.isIntersecting) {
			setShouldLoadStylesheet(true);
		}
	}, [eagerStylesheet, entry?.isIntersecting]);

	useEffect(() => {
		if (!shouldLoadStylesheet || isStylesheetLoaded) return;

		for (const sheet of document.styleSheets) {
			if (sheet.href === stylesheetHref) {
				setStylesheetLoaded(true);
				return;
			}
		}
	}, [isStylesheetLoaded, shouldLoadStylesheet, stylesheetHref]);

	const isNotLatin =
		font.defSubset !== 'latin' ||
		font.category === 'icons' ||
		font.category === 'other';
	const previewText =
		preview ||
		(isNotLatin
			? getPreviewText(font.defSubset, font.id)
			: getPreviewText('latin'));

	return (
		<Box
			className={classes.wrapper}
			mih={{ base: '150px', sm: layout === 'grid' ? '332px' : '150px' }}
			ref={ref}
		>
			{shouldLoadStylesheet && (
				<link
					rel="stylesheet"
					href={stylesheetHref}
					onLoad={() => setStylesheetLoaded(true)}
					onError={() => setStylesheetLoaded(true)}
				/>
			)}
			<Link
				className={classes.link}
				prefetch="intent"
				to={`/fonts/${font.id}`}
				state={{ fontResults: `${location.pathname}${location.search}` }}
			>
				<div className={classes.preview}>
					<Skeleton name="search-hit-preview" loading={!isFontReady}>
						<Text
							fz={size}
							mih={layout === 'grid' ? previewHeight : undefined}
							style={{ fontFamily: `"${font.family}", "Fallback Outline"` }}
						>
							{previewText}
						</Text>
					</Skeleton>
				</div>
				<Group className={classes['text-group']}>
					<Text fz={18} fw={700} component="span">
						{font.family}
					</Text>
					{font.variable && (
						<Text fz={15} fw={700} component="span">
							Variable
						</Text>
					)}
				</Group>
			</Link>
		</Box>
	);
};

export { FontCard };
