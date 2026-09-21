import { Box, Group, Text } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useIsFontReady } from '@/hooks/useIsFontLoaded';
import { getCardPreviewFamily, getFontFamilyStack } from '@/utils/font-preview';
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
	// Authored specimens can use glyphs excluded from the package subset.
	const useRegistryPreview = Boolean(font.sampleText);
	const stylesheetHref = useRegistryPreview
		? `/resources/font-preview/${font.id}`
		: `https://cdn.jsdelivr.net/fontsource/css/${font.id}@latest/${font.previewSubset ?? 'index'}.css`;
	const previewFamily = useRegistryPreview
		? getCardPreviewFamily(font.id)
		: font.family;
	const { ref, entry } = useIntersection<HTMLDivElement>({
		rootMargin: '150% 0px',
	});
	const [shouldLoadStylesheet, setShouldLoadStylesheet] =
		useState(eagerStylesheet);
	const [isStylesheetLoaded, setStylesheetLoaded] = useState(false);
	const isFontReady = useIsFontReady(previewFamily, isStylesheetLoaded);

	useEffect(() => {
		if (eagerStylesheet || entry?.isIntersecting) {
			setShouldLoadStylesheet(true);
		}
	}, [eagerStylesheet, entry?.isIntersecting]);

	useEffect(() => {
		if (!shouldLoadStylesheet || isStylesheetLoaded) return;

		const href = new URL(stylesheetHref, window.location.href).href;
		for (const sheet of document.styleSheets) {
			if (sheet.href === href) {
				setStylesheetLoaded(true);
				return;
			}
		}
	}, [isStylesheetLoaded, shouldLoadStylesheet, stylesheetHref]);

	const previewText =
		preview ||
		font.sampleText?.short ||
		getPreviewText(font.previewSubset ?? font.defSubset);
	const fontFamily = getFontFamilyStack(
		{ ...font, family: previewFamily },
		false,
		font,
	);

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
							style={{ fontFamily }}
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
