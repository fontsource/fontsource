import type { Node } from 'takumi-js';
import type { Renderer } from 'takumi-js/wasm';
import type { SourceFontMetadata } from '../../../../shared/catalog';
import {
	getOpenGraphIconLigatures,
	getOpenGraphSpecimenMaxFontSize,
	getOpenGraphSpecimenText,
	shouldUseOpenGraphPreviewTitle,
} from './font-exceptions';

export const OPEN_GRAPH_WIDTH = 1200;
export const OPEN_GRAPH_HEIGHT = 630;
export const UI_FONT_FAMILY = 'IBM Plex Sans';
export const PREVIEW_FONT_FAMILY = 'Fontsource Preview';
export const OPEN_GRAPH_LOGO_SRC = 'fontsource-logo.svg';

interface OpenGraphTextLayout {
	specimenText: string;
	titleLines: string[];
	titleFontSize: number;
	specimenFontSize: number;
}

const colors = {
	border: '#e1e3ec',
	ink: '#01112c',
	muted: '#667086',
	purple: '#625bf8',
	white: '#ffffff',
} as const;

const logoNode: Node = {
	type: 'image',
	src: OPEN_GRAPH_LOGO_SRC,
	width: 239,
	height: 46,
	style: {
		left: 46,
		position: 'absolute',
		top: 48,
	},
};

const MEASURE_FONT_SIZE = 100;
const MAX_TITLE_FONT_SIZE = 154;
const TITLE_FIT_HEIGHT = 315;
const TITLE_LINE_HEIGHT = 0.9;
const MAX_SPECIMEN_FONT_SIZE = 220;
const MAX_HANDWRITING_SPECIMEN_FONT_SIZE = 176;
const SPECIMEN_FIT_WIDTH = 340;
const SPECIMEN_FIT_HEIGHT = 220;

const getTitleLineCandidates = (family: string): string[][] => {
	const words = family.trim().split(/\s+/);
	const candidates = [[family]];

	for (let index = 1; index < words.length; index += 1) {
		candidates.push([
			words.slice(0, index).join(' '),
			words.slice(index).join(' '),
		]);
	}

	for (let first = 1; first < words.length - 1; first += 1) {
		for (let second = first + 1; second < words.length; second += 1) {
			candidates.push([
				words.slice(0, first).join(' '),
				words.slice(first, second).join(' '),
				words.slice(second).join(' '),
			]);
		}
	}

	return candidates;
};

const measureText = async (
	renderer: Renderer,
	text: string,
	fontFamily: string,
): Promise<{ height: number; width: number }> => {
	const measurement = await renderer.measure(
		{
			type: 'text',
			text,
			style: {
				fontFamily,
				fontSize: MEASURE_FONT_SIZE,
				fontWeight: 400,
				lineHeight: 1,
				whiteSpace: 'nowrap',
			},
		},
		{ height: MEASURE_FONT_SIZE * 2 },
	);

	return {
		height: Math.max(1, measurement.height),
		width: Math.max(1, measurement.width),
	};
};

export const fitOpenGraphText = async (
	renderer: Renderer,
	metadata: SourceFontMetadata,
	hasPreviewFont: boolean,
): Promise<OpenGraphTextLayout> => {
	const previewFontFamily =
		hasPreviewFont && shouldUseOpenGraphPreviewTitle(metadata)
			? PREVIEW_FONT_FAMILY
			: UI_FONT_FAMILY;
	const measurements = new Map<string, { height: number; width: number }>();
	const candidates = getTitleLineCandidates(metadata.family);

	for (const lines of candidates) {
		for (const line of lines) {
			if (!measurements.has(line)) {
				measurements.set(
					line,
					await measureText(renderer, line, previewFontFamily),
				);
			}
		}
	}

	let bestLayout = {
		fontSize: 0,
		imbalance: Number.POSITIVE_INFINITY,
		lines: [metadata.family],
	};

	for (const lines of candidates) {
		const widths = lines.map((line) => measurements.get(line)?.width ?? 1);
		const widestLine = Math.max(...widths);
		const fontSize = Math.min(
			MAX_TITLE_FONT_SIZE,
			Math.floor(TITLE_FIT_HEIGHT / (lines.length * TITLE_LINE_HEIGHT)),
			Math.max(1, Math.floor((650 * MEASURE_FONT_SIZE) / widestLine) - 1),
		);
		const imbalance = Math.max(...widths) - Math.min(...widths);

		if (
			fontSize > bestLayout.fontSize ||
			(fontSize === bestLayout.fontSize &&
				lines.length < bestLayout.lines.length) ||
			(fontSize === bestLayout.fontSize &&
				lines.length === bestLayout.lines.length &&
				imbalance < bestLayout.imbalance)
		) {
			bestLayout = { fontSize, imbalance, lines };
		}
	}

	const specimenFontFamily = hasPreviewFont
		? PREVIEW_FONT_FAMILY
		: UI_FONT_FAMILY;
	const specimenText = getOpenGraphSpecimenText(metadata);
	const isIconFont = Boolean(getOpenGraphIconLigatures(metadata));
	const specimenMeasurement = isIconFont
		? { height: MEASURE_FONT_SIZE, width: MEASURE_FONT_SIZE }
		: await measureText(renderer, specimenText, specimenFontFamily);
	const specimenFontSize = isIconFont
		? 62
		: Math.min(
				getOpenGraphSpecimenMaxFontSize(
					metadata,
					metadata.category === 'handwriting'
						? MAX_HANDWRITING_SPECIMEN_FONT_SIZE
						: MAX_SPECIMEN_FONT_SIZE,
				),
				Math.max(
					1,
					Math.floor(
						(SPECIMEN_FIT_WIDTH * MEASURE_FONT_SIZE) /
							specimenMeasurement.width,
					) - 1,
				),
				Math.max(
					1,
					Math.floor(
						(SPECIMEN_FIT_HEIGHT * MEASURE_FONT_SIZE) /
							specimenMeasurement.height,
					) - 1,
				),
			);

	return {
		specimenFontSize,
		specimenText,
		titleFontSize: bestLayout.fontSize,
		titleLines: bestLayout.lines,
	};
};

const createMetadataChildren = (metadata: SourceFontMetadata): Node[] => {
	const children: Node[] = [];
	const weightCount = metadata.weights.length;
	const labels = [
		metadata.family,
		metadata.category,
		metadata.variable ? 'variable' : 'static',
		`${weightCount} weight${weightCount === 1 ? '' : 's'}`,
		metadata.license.type,
	];

	for (const [index, label] of labels.entries()) {
		if (index > 0) {
			children.push({
				type: 'container',
				style: {
					backgroundColor: '#c9c8f8',
					height: 24,
					width: 1,
				},
			});
		}
		children.push({
			type: 'text',
			text: label.toUpperCase(),
			style: {
				color: index === 0 ? colors.purple : colors.muted,
				fontFamily: UI_FONT_FAMILY,
				fontSize: 16,
				fontWeight: 600,
				letterSpacing: 0.7,
				lineHeight: 1,
			},
		});
	}

	return children;
};

const createSpecimenNode = (
	metadata: SourceFontMetadata,
	layout: OpenGraphTextLayout,
	hasPreviewFont: boolean,
): Node => {
	const iconLigatures = getOpenGraphIconLigatures(metadata);
	const previewFontFamily = hasPreviewFont
		? PREVIEW_FONT_FAMILY
		: UI_FONT_FAMILY;

	return {
		type: 'container',
		style: {
			alignItems: 'center',
			display: 'flex',
			gap: 28,
			height: 230,
			justifyContent: 'center',
			left: 0,
			position: 'absolute',
			top: 72,
			width: 434,
		},
		children:
			iconLigatures && hasPreviewFont
				? iconLigatures.map(
						(icon): Node => ({
							type: 'text',
							text: icon,
							style: {
								color: colors.ink,
								fontFamily: previewFontFamily,
								fontFeatureSettings: '"liga"',
								fontSize: layout.specimenFontSize,
								fontWeight: 400,
								lineHeight: 1,
								whiteSpace: 'nowrap',
							},
						}),
					)
				: [
						{
							type: 'text',
							text: layout.specimenText,
							style: {
								color: colors.ink,
								fontFamily: previewFontFamily,
								fontSize: layout.specimenFontSize,
								fontWeight: 400,
								lineHeight: 1,
							},
						},
					],
	};
};

const createTitleNode = (
	metadata: SourceFontMetadata,
	hasPreviewFont: boolean,
	layout: OpenGraphTextLayout,
): Node => {
	const previewFontFamily =
		hasPreviewFont && shouldUseOpenGraphPreviewTitle(metadata)
			? PREVIEW_FONT_FAMILY
			: UI_FONT_FAMILY;

	return {
		type: 'container',
		style: {
			alignItems: 'flex-start',
			display: 'flex',
			flexDirection: 'column',
			height: 330,
			justifyContent: 'center',
			left: 48,
			overflow: 'hidden',
			position: 'absolute',
			top: layout.titleLines.length === 1 ? 134 : 156,
			width: 650,
		},
		children: layout.titleLines.map(
			(line): Node => ({
				type: 'text',
				text: line,
				style: {
					color: colors.ink,
					fontFamily: previewFontFamily,
					fontSize: layout.titleFontSize,
					fontWeight: 400,
					lineHeight: TITLE_LINE_HEIGHT,
					whiteSpace: 'nowrap',
				},
			}),
		),
	};
};

export const createFontOpenGraphNode = (
	metadata: SourceFontMetadata,
	layout: OpenGraphTextLayout,
	hasPreviewFont: boolean,
): Node => ({
	type: 'container',
	style: {
		background:
			'linear-gradient(135deg, #ffffff 0%, #f7f8fc 66%, #eeeeff 100%)',
		color: colors.ink,
		height: OPEN_GRAPH_HEIGHT,
		overflow: 'hidden',
		position: 'relative',
		width: OPEN_GRAPH_WIDTH,
	},
	children: [
		{
			type: 'container',
			style: {
				background:
					'linear-gradient(135deg, rgba(218, 213, 255, 0) 0%, rgba(218, 213, 255, 0.82) 100%)',
				clipPath: 'polygon(36% 0, 100% 0, 100% 100%, 0 100%)',
				height: 76,
				left: 960,
				position: 'absolute',
				top: 554,
				width: 240,
			},
		},
		createTitleNode(metadata, hasPreviewFont, layout),
		{
			type: 'container',
			style: {
				backgroundColor: colors.purple,
				clipPath: 'polygon(0 0, 92% 0, 100% 8%, 100% 100%, 0 100%)',
				height: 394,
				left: 732,
				position: 'absolute',
				top: 125,
				width: 434,
			},
			children: [
				{
					type: 'container',
					style: {
						backgroundColor: colors.white,
						clipPath: 'polygon(0 0, 92% 0, 100% 8%, 100% 100%, 0 100%)',
						height: 392,
						left: 1,
						position: 'absolute',
						top: 1,
						width: 432,
					},
				},
				...[0, 1, 2, 3].map(
					(index): Node => ({
						type: 'container',
						style: {
							backgroundColor: '#8d88fa',
							height: 1,
							left: 318 + index * 11,
							position: 'absolute',
							top: 0,
							transform: 'rotate(45deg)',
							transformOrigin: 'left top',
							width: 170,
						},
					}),
				),
				createSpecimenNode(metadata, layout, hasPreviewFont),
			],
		},
		{
			type: 'container',
			style: {
				backgroundColor: colors.border,
				height: 1,
				left: 46,
				position: 'absolute',
				top: 535,
				width: 1120,
			},
		},
		{
			type: 'container',
			style: {
				alignItems: 'center',
				display: 'flex',
				gap: 36,
				left: 46,
				position: 'absolute',
				top: 574,
			},
			children: createMetadataChildren(metadata),
		},
		logoNode,
	],
});
