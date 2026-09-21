import { Box, Group, Text } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { Link, useLocation } from 'react-router';
import { useIsFontReady } from '@/hooks/useIsFontLoaded';
import { usePreviewStylesheet } from '@/hooks/usePreviewStylesheet';
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
	const isStylesheetReady = usePreviewStylesheet(
		stylesheetHref,
		eagerStylesheet || Boolean(entry?.isIntersecting),
	);
	const isFontReady = useIsFontReady(font.family, isStylesheetReady);

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
