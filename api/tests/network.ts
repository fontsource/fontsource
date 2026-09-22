import { setupNetwork } from '@msw/cloudflare';
import { HttpResponse, http, passthrough } from 'msw';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import { toResponseBody } from '../shared/response';
import { UPSTREAM_URLS } from '../worker/src/constants';
import {
	staticWoff2Bytes,
	staticWoffBytes,
	variableWoff2Bytes,
} from './fixtures/fonts';
import {
	scheduledAxisRegistry,
	scheduledCatalog,
	testVersions,
} from './fixtures/metadata';
import { publishedFiles } from './fixtures/published-files';

export const toResponse = (body: string | Uint8Array<ArrayBufferLike>) =>
	new Response(toResponseBody(body), {
		headers: {
			'Content-Length': String(
				typeof body === 'string'
					? new TextEncoder().encode(body).byteLength
					: body.byteLength,
			),
		},
	});

const dailyDownloads = (from: string, to: string) => {
	const values: Array<{ day: string; downloads: number }> = [];
	const current = new Date(`${from}T00:00:00.000Z`);
	const end = new Date(`${to}T00:00:00.000Z`);

	while (current <= end) {
		values.push({ day: current.toISOString().slice(0, 10), downloads: 1 });
		current.setUTCDate(current.getUTCDate() + 1);
	}

	return values;
};

const staticBinaryResponse = (url: string): Response => {
	if (url.endsWith('.woff2')) {
		return toResponse(staticWoff2Bytes);
	}

	if (url.endsWith('.woff')) {
		return toResponse(staticWoffBytes);
	}

	throw new Error(`Unexpected static asset URL: ${url}`);
};

const packageFileMetaResponse = (packageName: string): Response => {
	const id = packageName.replace(/^@fontsource(?:-variable)?\//, '');
	const filenames = publishedFiles[packageName];
	if (!filenames) {
		throw new Error(`Unexpected package file metadata fetch: ${packageName}`);
	}
	const files = filenames.map((name) => ({ name: `/files/${id}-${name}` }));

	return toResponse(
		JSON.stringify({
			files,
		}),
	);
};

const versionPayloads: Record<string, string[]> = {
	'@fontsource/abel': testVersions.abel.static,
	'@fontsource/recursive': testVersions.recursive.static,
	'@fontsource/familypack': testVersions.familypack.static,
	'@fontsource-variable/recursive': testVersions.recursive.variable ?? [],
};

const unexpectedRequests: string[] = [];
const handlerErrors: Error[] = [];

const handlers = [
	http.get(`${UPSTREAM_URLS.npmRegistry}/*`, ({ request }) => {
		const packageName = decodeURIComponent(
			request.url.slice(`${UPSTREAM_URLS.npmRegistry}/`.length),
		);
		return Object.hasOwn(versionPayloads, packageName) ||
			packageName === 'fontsource-abel'
			? HttpResponse.json({ time: { created: '2025-01-01T00:00:00.000Z' } })
			: new HttpResponse(null, { status: 404 });
	}),
	http.get(`${UPSTREAM_URLS.npmDownloadsPoint}/last-month/*`, () =>
		HttpResponse.json({ downloads: 42 }),
	),
	http.get(`${UPSTREAM_URLS.npmDownloads}/*`, ({ request }) => {
		const period = request.url
			.slice(`${UPSTREAM_URLS.npmDownloads}/`.length)
			.split('/')[0];
		const [from, to] = period.split(':');
		return HttpResponse.json({
			start: from,
			end: to,
			downloads: dailyDownloads(from, to),
		});
	}),
	http.get(`${UPSTREAM_URLS.jsdelivrStats}/*`, ({ request }) => {
		const url = new URL(request.url);
		const packagePath = url.pathname.slice('/v1/stats/packages/npm/'.length);
		if (packagePath.includes('/'))
			throw new Error(`Unexpected scoped jsDelivr stats URL: ${url}`);
		const period = url.searchParams.get('period');
		const currentYear = new Date().getUTCFullYear();
		if (period === String(currentYear))
			return new HttpResponse(null, { status: 400 });
		const hits =
			period === 'year'
				? {
						total: 1200,
						dates: {
							[`${currentYear - 1}-12-31`]: 1000,
							[`${currentYear}-01-01`]: 80,
							[`${currentYear}-01-02`]: 120,
						},
					}
				: { total: period === 'month' ? 20 : 200 };
		return HttpResponse.json({ hits });
	}),
	http.get(`${UPSTREAM_URLS.jsdelivrPackage}/*`, ({ request }) => {
		const url = new URL(request.url);
		const path = url.pathname.slice(
			new URL(UPSTREAM_URLS.jsdelivrPackage).pathname.length + 1,
		);
		if (url.searchParams.get('structure') === 'flat') {
			const packageRef = path.replace(/@([^@/]+)$/, '');
			return packageFileMetaResponse(packageRef);
		}
		const versions = versionPayloads[path];
		if (!versions) throw new Error(`Unexpected package metadata fetch: ${url}`);
		return HttpResponse.json({
			versions: versions.map((version) => ({ version })),
		});
	}),
	http.get(`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/*`, ({ request }) =>
		request.url.endsWith('/LICENSE')
			? HttpResponse.text('Example License')
			: staticBinaryResponse(request.url),
	),
	http.get(
		`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource-variable/*`,
		({ request }) =>
			request.url.endsWith('/LICENSE')
				? HttpResponse.text('Example License')
				: toResponse(variableWoff2Bytes),
	),
	http.get(UPSTREAM_URLS.catalog, () => HttpResponse.json(scheduledCatalog)),
	http.get(UPSTREAM_URLS.axisRegistry, () =>
		HttpResponse.json(scheduledAxisRegistry),
	),
	http.all('*', ({ request }) => {
		const url = new URL(request.url);
		// Vite serves local font-processing WASM during Worker tests.
		if (
			url.protocol === 'data:' ||
			((url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
				url.pathname.endsWith('.wasm'))
		)
			return passthrough();
		unexpectedRequests.push(request.url);
		return HttpResponse.error();
	}),
];

export const network = setupNetwork();
network.events.on('unhandledException', ({ error }) => {
	handlerErrors.push(error);
});

beforeAll(() => {
	network.enable();
	network.use(...handlers);
});
afterEach(() => {
	network.resetHandlers(...handlers);
	const requests = unexpectedRequests.splice(0);
	const errors = handlerErrors.splice(0);
	expect(requests, 'Unexpected outbound requests').toEqual([]);
	expect(errors, 'Unhandled network handler errors').toEqual([]);
});
afterAll(() => network.disable());

export const mockUpstreamResponses = (
	responses: Record<string, Response | (() => Response | Promise<Response>)>,
) => {
	network.resetHandlers(...handlers);
	network.use(
		...Object.entries(responses).map(([url, response]) =>
			http.get(
				new URL(url).origin + new URL(url).pathname,
				async ({ request }) => {
					if (request.url !== url) return;
					return typeof response === 'function'
						? await response()
						: response.clone();
				},
			),
		),
	);
};
