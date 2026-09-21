import { Box, Group, Text } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { preinit } from 'react-dom';
import { Link, useLocation } from 'react-router';
import invariant from 'tiny-invariant';
import { useIsFontReady } from '@/hooks/useIsFontLoaded';
import { getFontFamilyStack } from '@/utils/font-preview';
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
	const [isStylesheetReady, setStylesheetReady] = useState(false);
	const isFontReady = useIsFontReady(font.family, isStylesheetReady);

	useEffect(() => {
		// Keep loading enabled when a card leaves the viewport mid-request.
		if (eagerStylesheet || entry?.isIntersecting) {
			setShouldLoadStylesheet(true);
		}
	}, [eagerStylesheet, entry?.isIntersecting]);

	useEffect(() => {
		if (!shouldLoadStylesheet) return;

		// React retains and deduplicates the stylesheet across virtualized cards.
		preinit(stylesheetHref, { as: 'style', precedence: 'font-preview' });
		const stylesheet = document.querySelector<HTMLLinkElement>(
			`link[rel="stylesheet"][href="${CSS.escape(stylesheetHref)}"]`,
		);
		invariant(stylesheet, 'Missing preview stylesheet');
		let active = true;
		const ready = () => {
			stylesheet.dataset.fontPreviewReady = 'true';
			stylesheet.removeEventListener('load', ready);
			stylesheet.removeEventListener('error', ready);
			if (active) setStylesheetReady(true);
		};
		if (stylesheet.sheet || stylesheet.dataset.fontPreviewReady) {
			ready();
			return;
		}
		stylesheet.addEventListener('load', ready);
		stylesheet.addEventListener('error', ready);
		return () => {
			// Remember failures even if this card unmounts before the request settles.
			active = false;
		};
	}, [shouldLoadStylesheet, stylesheetHref]);

	const previewText =
		preview ||
		font.sampleText?.short ||
		getPreviewText(font.previewSubset ?? font.defSubset);
	const fontFamily = getFontFamilyStack(font, false, font);

	return (
		<Box
			className={classes.wrapper}
			mih={{ base: '150px', sm: layout === 'grid' ? '332px' : '150px' }}
			ref={ref}
		>
			{eagerStylesheet && (
				<link rel="preload" as="style" href={stylesheetHref} />
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
