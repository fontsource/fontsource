import type { Context } from 'hono';
import wasmModule, { init as initWasm, Renderer } from 'takumi-js/wasm';
import logoSvg from '../../../../../../website/public/logo.svg?raw';
import type { SourceFontMetadata } from '../../../../shared/catalog';
import { fetchPackageAssetBytes } from '../../../../shared/upstream';
import type { AppEnv } from '../../env';
import { notFound } from '../../utils/errors';
import { getFontById } from '../metadata/store';
import { getOpenGraphPreviewSubset } from './font-exceptions';
import {
	createFontOpenGraphNode,
	fitOpenGraphText,
	OPEN_GRAPH_HEIGHT,
	OPEN_GRAPH_LOGO_SRC,
	OPEN_GRAPH_WIDTH,
	PREVIEW_FONT_FAMILY,
} from './template';
import { UI_FONTS } from './ui-font';

const logoData = new TextEncoder().encode(logoSvg);

let rendererInitialization: Promise<void> | undefined;

const initializeRenderer = (): Promise<void> => {
	rendererInitialization ??= initWasm({ module_or_path: wasmModule }).then(
		() => undefined,
	);
	return rendererInitialization;
};

const createRenderer = async (): Promise<Renderer> => {
	await initializeRenderer();
	const renderer = new Renderer();
	try {
		for (const font of UI_FONTS) {
			await renderer.registerFont({
				data: font.data,
				name: font.name,
				weight: font.weight,
			});
		}
		return renderer;
	} catch (error) {
		renderer.free();
		throw error;
	}
};

const loadPreviewFont = async (
	metadata: SourceFontMetadata,
): Promise<Uint8Array> => {
	const style = metadata.styles.includes('normal')
		? 'normal'
		: (metadata.styles[0] ?? 'normal');
	const weight = metadata.weights.includes(400)
		? 400
		: (metadata.weights[0] ?? 400);
	const file = `${getOpenGraphPreviewSubset(metadata)}-${weight}-${style}.woff2`;
	return fetchPackageAssetBytes(metadata.id, 'latest', file);
};

const renderImage = async (
	metadata: SourceFontMetadata,
	font: Uint8Array | undefined,
): Promise<Uint8Array<ArrayBufferLike>> => {
	const renderer = await createRenderer();
	try {
		if (font) {
			await renderer.registerFont({
				data: font,
				key: 'fontsource-preview',
				name: PREVIEW_FONT_FAMILY,
				style: 'normal',
				weight: 400,
			});
		}

		const hasPreviewFont = Boolean(font);
		const layout = await fitOpenGraphText(renderer, metadata, hasPreviewFont);
		return Uint8Array.from(
			await renderer.render(
				createFontOpenGraphNode(metadata, layout, hasPreviewFont),
				{
					width: OPEN_GRAPH_WIDTH,
					height: OPEN_GRAPH_HEIGHT,
					format: 'png',
					images: [
						{
							cache: 'none',
							data: logoData,
							src: OPEN_GRAPH_LOGO_SRC,
						},
					],
				},
			),
		);
	} finally {
		renderer.free();
	}
};

export const getFontOpenGraphImage = async (
	c: Context<AppEnv>,
	id: string,
): Promise<Response> => {
	const metadata = await getFontById(c, id);
	if (!metadata) {
		throw notFound(`Not Found. Font "${id}" does not exist.`);
	}

	let image: Uint8Array<ArrayBufferLike>;
	try {
		image = await renderImage(metadata, await loadPreviewFont(metadata));
	} catch (error) {
		console.error(
			JSON.stringify({
				message: 'Falling back while rendering a font Open Graph image',
				fontId: id,
				error: error instanceof Error ? error.message : String(error),
			}),
		);
		image = await renderImage(metadata, undefined);
	}

	const headers = new Headers({
		'Content-Type': 'image/png',
	});
	const lastModified = Date.parse(metadata.lastModified);
	if (!Number.isNaN(lastModified)) {
		headers.set('Last-Modified', new Date(lastModified).toUTCString());
	}

	return new Response(image, { headers });
};
