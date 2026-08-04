import { Tooltip } from '@mantine/core';
import { useIsomorphicEffect } from '@mantine/hooks';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { IconVertical } from '@/components/icons';

import classes from './CharacterExplorer.module.css';

interface GlyphSpecimenProps {
	canInspectMetrics: boolean;
	character: string;
	copied: boolean;
	showLatinGuides: boolean;
	style: CSSProperties;
}

interface GlyphMetrics {
	baseline: number;
	fontSize: number;
	guides: Array<{ label: string; y: number }>;
}

const viewWidth = 320;
const viewHeight = 184;
const baseFontSize = 128;
const specimenTop = 24;
const specimenBottom = 150;

const getCanvasFont = (style: CSSProperties) => {
	const fontStyle = style.fontStyle ?? 'normal';
	const fontWeight = style.fontWeight ?? 400;
	const fontFamily = style.fontFamily ?? 'sans-serif';
	return `${fontStyle} ${fontWeight} ${baseFontSize}px ${fontFamily}`;
};

const measureGlyph = (
	character: string,
	canvasFont: string,
	showLatinGuides: boolean,
) => {
	const context = document.createElement('canvas').getContext('2d');
	if (!context) return undefined;

	context.font = canvasFont;
	const glyph = context.measureText(character);
	const glyphHeight =
		glyph.actualBoundingBoxAscent + glyph.actualBoundingBoxDescent;
	const glyphWidth = glyph.actualBoundingBoxLeft + glyph.actualBoundingBoxRight;
	const scale = Math.min(
		1,
		(specimenBottom - specimenTop) / Math.max(glyphHeight, 1),
		(viewWidth - 72) / Math.max(glyphWidth, glyph.width, 1),
	);
	const baseline = specimenTop + glyph.actualBoundingBoxAscent * scale;
	const bottom = baseline + glyph.actualBoundingBoxDescent * scale;
	const guides = showLatinGuides
		? [
				{
					label: 'Cap',
					y:
						baseline - context.measureText('H').actualBoundingBoxAscent * scale,
				},
				{
					label: 'x-height',
					y:
						baseline - context.measureText('x').actualBoundingBoxAscent * scale,
				},
				{ label: 'Baseline', y: baseline },
			]
		: [
				{ label: 'Top', y: specimenTop },
				{ label: 'Baseline', y: baseline },
				...(Math.abs(bottom - baseline) > 6
					? [{ label: 'Bottom', y: bottom }]
					: []),
			];

	return {
		baseline,
		fontSize: baseFontSize * scale,
		guides,
	} satisfies GlyphMetrics;
};

export const GlyphSpecimen = ({
	canInspectMetrics,
	character,
	copied,
	showLatinGuides,
	style,
}: GlyphSpecimenProps) => {
	const [showMetrics, setShowMetrics] = useState(false);
	const [metrics, setMetrics] = useState<GlyphMetrics>();
	const canvasFont = getCanvasFont(style);
	const metricsEnabled = showMetrics && canInspectMetrics;

	useIsomorphicEffect(() => {
		setMetrics(undefined);
		if (!metricsEnabled) {
			return;
		}

		let cancelled = false;
		void document.fonts.ready.then(() => {
			if (!cancelled) {
				setMetrics(measureGlyph(character, canvasFont, showLatinGuides));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [canvasFont, character, metricsEnabled, showLatinGuides]);

	return (
		<div className={classes.largeCharacter} data-copied={copied || undefined}>
			{canInspectMetrics && (
				<Tooltip
					label={metricsEnabled ? 'Hide metrics' : 'Show metrics'}
					openDelay={500}
					withArrow
				>
					<button
						type="button"
						className={classes.metricsToggle}
						aria-label={metricsEnabled ? 'Hide metrics' : 'Show metrics'}
						aria-pressed={metricsEnabled}
						onClick={() => setShowMetrics((visible) => !visible)}
					>
						<IconVertical aria-hidden height={16} />
					</button>
				</Tooltip>
			)}

			{metrics ? (
				<svg
					className={classes.metricsView}
					viewBox={`0 0 ${viewWidth} ${viewHeight}`}
					aria-label={`${character} with typographic guides`}
					role="img"
				>
					{metrics.guides.map((guide) => (
						<g key={guide.label}>
							<line x1="58" x2="312" y1={guide.y} y2={guide.y} />
							<text x="8" y={guide.y + 4} className={classes.metricLabel}>
								{guide.label}
							</text>
						</g>
					))}
					<text
						x={viewWidth / 2}
						y={metrics.baseline}
						fill="currentColor"
						fontSize={metrics.fontSize}
						style={style}
						textAnchor="middle"
					>
						{character}
					</text>
				</svg>
			) : (
				<span className={classes.glyphShape} style={style}>
					{character}
				</span>
			)}
		</div>
	);
};
