import { Button, Group, Text } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { Link, useLocation } from 'react-router';
import type { ListRegistryLanguagesResponse } from '@/generated/api';
import { useIsFontReady } from '@/hooks/useIsFontLoaded';
import { usePreviewStylesheet } from '@/hooks/usePreviewStylesheet';
import {
	getFontFamilyStack,
	getPreviewLanguageTag,
} from '@/utils/font-preview';
import type { FontSummary } from '@/utils/font-summary';
import {
	getRecommendedPreviewLanguage,
	getRecommendedPreviewText,
} from '@/utils/language/language';
import classes from './FontCard.module.css';
import { Skeleton } from './Skeleton';

interface FontCardProps {
	font: FontSummary;
	layout?: 'grid' | 'list';
	preview?: string;
	previewLanguageId?: string;
	languages?: ListRegistryLanguagesResponse;
	previewHeight?: number;
	size: number;
	eagerStylesheet?: boolean;
}

const FontCard = ({
	font,
	layout = 'grid',
	preview,
	previewLanguageId,
	languages,
	previewHeight,
	size,
	eagerStylesheet = false,
}: FontCardProps) => {
	const location = useLocation();
	const stylesheetHref = `https://cdn.jsdelivr.net/fontsource/css/${font.id}@latest/index.css`;
	const { ref, entry } = useIntersection<HTMLDivElement>({
		rootMargin: '150% 0px',
	});
	const stylesheetStatus = usePreviewStylesheet(
		stylesheetHref,
		eagerStylesheet || Boolean(entry?.isIntersecting),
	);
	const isFontReady = useIsFontReady(
		font.family,
		stylesheetStatus === 'loaded',
	);
	const previewFailed = stylesheetStatus === 'failed';

	const previewText =
		preview ?? getRecommendedPreviewText(font, 'short', languages);
	const sampleLanguage =
		languages?.find((language) => language.id === previewLanguageId) ??
		getRecommendedPreviewLanguage(font, languages ?? []);
	const fontFamily = getFontFamilyStack(font, false, font);

	return (
		<div className={classes.wrapper} data-layout={layout} ref={ref}>
			{eagerStylesheet && (
				<link rel="preload" as="style" href={stylesheetHref} />
			)}
			<Link
				className={classes.link}
				prefetch="intent"
				to={`/fonts/${font.id}`}
				state={{
					fontResults: `${location.pathname}${location.search}`,
					previewText: preview,
					previewLanguageId,
				}}
			>
				<div className={classes.preview}>
					{previewFailed ? (
						<Text c="dimmed" mih={layout === 'grid' ? previewHeight : 72}>
							Preview unavailable
						</Text>
					) : (
						<Skeleton name="search-hit-preview" loading={!isFontReady}>
							<Text
								dir={sampleLanguage?.direction}
								lang={getPreviewLanguageTag(sampleLanguage)}
								fz={size}
								mih={layout === 'grid' ? previewHeight : undefined}
								style={{ fontFamily }}
							>
								{previewText}
							</Text>
						</Skeleton>
					)}
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
			{previewFailed && (
				<Button
					pos="absolute"
					top={64}
					left={24}
					size="xs"
					variant="default"
					onClick={() => window.location.reload()}
				>
					Reload page
				</Button>
			)}
		</div>
	);
};

export { FontCard };
