import { useIsomorphicEffect } from '@mantine/hooks';
import type { CSSProperties } from 'react';
import { useRef, useState } from 'react';

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
	fitted: boolean;
	fontSize: number;
	guides: Array<{ label: string; y: number }>;
}

const viewWidth = 220;
const viewHeight = 220;
const baseFontSize = 152;
const specimenTop = 24;
const specimenBottom = viewHeight - specimenTop;

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
		fitted: false,
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
	const glyphRef = useRef<SVGTextElement>(null);
	const [metricsPinned, setMetricsPinned] = useState(false);
	const [metrics, setMetrics] = useState<GlyphMetrics>();
	const canvasFont = getCanvasFont(style);

	useIsomorphicEffect(() => {
		setMetrics(undefined);
		let cancelled = false;
		const updateMetrics = () => {
			if (!cancelled) {
				setMetrics(measureGlyph(character, canvasFont, showLatinGuides));
			}
		};

		void document.fonts
			.load(canvasFont, character)
			.then(updateMetrics, () => {});

		return () => {
			cancelled = true;
		};
	}, [canvasFont, character, showLatinGuides]);

	useIsomorphicEffect(() => {
		if (!metrics || metrics.fitted || !glyphRef.current) return;

		const bounds = glyphRef.current.getBBox();
		const scale = Math.min(
			1,
			(viewWidth - 72) / Math.max(bounds.width, 1),
			(specimenBottom - specimenTop) / Math.max(bounds.height, 1),
		);
		const baseline =
			viewHeight / 2 -
			(bounds.y + bounds.height / 2 - metrics.baseline) * scale;

		setMetrics({
			baseline,
			fitted: true,
			fontSize: metrics.fontSize * scale,
			guides: metrics.guides.map((guide) => ({
				...guide,
				y: baseline + (guide.y - metrics.baseline) * scale,
			})),
		});
	}, [metrics]);

	const specimen = (
		<svg
			className={classes.metricsView}
			viewBox={`0 0 ${viewWidth} ${viewHeight}`}
			aria-label={`Character ${character}`}
			role="img"
		>
			{canInspectMetrics && (
				<g className={classes.metricsGuides}>
					{metrics?.guides.map((guide) => (
						<g key={guide.label}>
							<line x1="46" x2="212" y1={guide.y} y2={guide.y} />
							<text x="8" y={guide.y + 4} className={classes.metricLabel}>
								{guide.label}
							</text>
						</g>
					))}
				</g>
			)}
			<text
				ref={glyphRef}
				className={classes.glyphShape}
				x={viewWidth / 2}
				y={metrics?.baseline ?? viewHeight / 2}
				dominantBaseline={metrics ? undefined : 'central'}
				fill="currentColor"
				fontSize={metrics?.fontSize ?? 112}
				style={style}
				textAnchor="middle"
			>
				{character}
			</text>
		</svg>
	);

	if (!canInspectMetrics) {
		return (
			<div className={classes.largeCharacter} data-copied={copied || undefined}>
				{specimen}
			</div>
		);
	}

	return (
		<button
			type="button"
			className={classes.largeCharacter}
			aria-label={`${metricsPinned ? 'Unpin' : 'Pin'} metrics for ${character}`}
			aria-pressed={metricsPinned}
			data-copied={copied || undefined}
			data-metrics-pinned={metricsPinned || undefined}
			onClick={() => setMetricsPinned((pinned) => !pinned)}
		>
			{specimen}
		</button>
	);
};
