import type {
	CSSAsset,
	FontFace,
	FontSource,
	VariableAxisConfig,
} from '../types';
import { type CSSRenderOptions, renderFontFaceRule } from './face-rule';
import {
	groupFacesByCSSFile,
	pickStaticIndexCSS,
	pickVariableIndexCSS,
} from './planner';

export interface CSSOptions extends CSSRenderOptions {
	resolver?: UrlResolver;
}

export type UrlResolver = (input: {
	face: FontFace;
	source: FontSource;
}) => string;

/** Adapt build faces without inferring additional variants or filenames. */
const renderFontFace = (
	face: FontFace,
	family: string,
	options: CSSOptions,
): string =>
	renderFontFaceRule(
		{
			family,
			style: face.style,
			weight: face.weight,
			isVariable: face.isVariable,
			stretch: face.stretch,
			unicodeRange: face.unicodeRange === '' ? null : face.unicodeRange,
			sources: face.sources.map((source) => ({
				url: options.resolver
					? options.resolver({ face, source })
					: `./files/${source.filename}`,
				format:
					source.format === 'ttf'
						? 'truetype'
						: source.format === 'woff2' && face.isVariable
							? 'woff2-variations'
							: source.format,
			})),
		},
		options,
	);

/** Render the supplied faces in order, preserving their filenames and coverage. */
const generateCSS = (
	family: string,
	faces: readonly FontFace[],
	options: CSSOptions = {},
): string =>
	faces
		.map((face) => renderFontFace(face, family, options))
		.join(options.minify ? '' : '\n\n');

// Group resolved faces into published CSS assets.
const generateCSSAssets = (
	family: string,
	faces: readonly FontFace[],
	options: CSSOptions & { variable?: VariableAxisConfig } = {},
): CSSAsset[] => {
	const { variable } = options;
	const facesByFile = groupFacesByCSSFile(faces);

	const indexCSSFile = variable
		? pickVariableIndexCSS(variable, facesByFile)
		: pickStaticIndexCSS(faces);

	const indexFaces = indexCSSFile ? facesByFile.get(indexCSSFile) : undefined;
	if (indexFaces) facesByFile.set('index.css', indexFaces);

	// Subset, weight and index entrypoints share faces. Resolve URLs and render
	// each face once per build, without retaining anything between builds.
	const rendered = new Map<FontFace, string>();
	return Array.from(facesByFile, ([filename, faces]) => ({
		filename,
		content: faces
			.map((face) => {
				const css = rendered.get(face) ?? renderFontFace(face, family, options);
				rendered.set(face, css);
				return css;
			})
			.join(options.minify ? '' : '\n\n'),
	}));
};

export { generateCSS, generateCSSAssets };
