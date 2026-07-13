import { Box, Group, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { useIsFontReady } from '@/hooks/useIsFontLoaded';
import type { FontSummary } from '@/utils/font-summary';
import { getPreviewText } from '@/utils/language/language';
import classes from './FontCard.module.css';
import { Skeleton } from './Skeleton';

const DEFAULT_PREVIEW_TEXT = 'Sphinx of black quartz, judge my vow.';

interface FontCardProps {
	font: FontSummary;
	layout?: 'grid' | 'list';
	preview?: string;
	previewHeight?: number;
	size: number;
}

const FontCard = ({
	font,
	layout = 'grid',
	preview,
	previewHeight,
	size,
}: FontCardProps) => {
	const stylesheetHref = `https://cdn.jsdelivr.net/fontsource/css/${font.id}@latest/index.css`;
	const [isStylesheetLoaded, setStylesheetLoaded] = useState(false);
	const isFontReady = useIsFontReady(font.family, isStylesheetLoaded);

	useEffect(() => {
		if (isStylesheetLoaded) return;

		for (const sheet of document.styleSheets) {
			if (sheet.href === stylesheetHref) {
				setStylesheetLoaded(true);
				return;
			}
		}
	}, [isStylesheetLoaded, stylesheetHref]);

	const isNotLatin =
		font.defSubset !== 'latin' ||
		font.category === 'icons' ||
		font.category === 'other';
	const previewText =
		preview ||
		(isNotLatin
			? getPreviewText(font.defSubset, font.id)
			: DEFAULT_PREVIEW_TEXT);

	return (
		<Box
			className={classes.wrapper}
			mih={{ base: '150px', sm: layout === 'grid' ? '332px' : '150px' }}
		>
			<link
				rel="stylesheet"
				href={stylesheetHref}
				onLoad={() => setStylesheetLoaded(true)}
				onError={() => setStylesheetLoaded(true)}
			/>
			<Link className={classes.link} prefetch="intent" to={`/fonts/${font.id}`}>
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
