import type { LoaderFunctionArgs } from 'react-router';
import { getRegistryFamily } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import {
	getCardPreviewFamily,
	getRegistrySourcePreviewCSS,
} from '@/utils/font-preview';
import { loadRequiredRegistryData } from '@/utils/registry-request.server';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const id = params.id;
	if (!id || id.length > 96 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
		throw new Response('Font not found.', { status: 404 });
	}
	const registry = await loadRequiredRegistryData(
		getRegistryFamily({ id }, { signal: request.signal }),
		request.signal,
		'Font preview',
	);
	const source = registry.sources.find(
		({ sha256 }) => sha256 === registry.previewSource,
	);
	if (!source) {
		throw new Response('Font preview source is unavailable.', { status: 503 });
	}
	const css = getRegistrySourcePreviewCSS(source, getCardPreviewFamily(id));
	if (!css) {
		throw new Response('Font preview source is invalid.', { status: 503 });
	}
	return new Response(css, {
		headers: {
			'Content-Type': 'text/css; charset=utf-8',
			...cacheHeaders.short,
		},
	});
};
