import {
	createExecutionContext,
	createScheduledController,
	waitOnExecutionContext,
} from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KV_KEYS } from '../worker/src/constants';
import { clearMetadataCachesForTest } from '../worker/src/features/metadata/store';
import worker from '../worker/src/index';
import {
	dispatch,
	jsonSnapshot,
	serializeHeaders,
	setupWorkerTest,
	testAxisRegistry,
	testEnv,
} from './helpers';

const expandedAxisRegistry = {
	MONO: {
		name: 'Monospace',
		description: 'Monospace axis',
		min: 0,
		max: 1,
		default: 0,
		precision: 1,
	},
	OPSZ: {
		name: 'Optical Size',
		description: 'Optical size axis',
		min: 8,
		max: 144,
		default: 14,
		precision: 0,
	},
};

describe('metadata routes', () => {
	beforeEach(async () => {
		await setupWorkerTest();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const seedAxisRegistry = async (
		registry: typeof expandedAxisRegistry = expandedAxisRegistry,
	) => {
		await testEnv.METADATA.put(KV_KEYS.axisRegistry, JSON.stringify(registry));
		clearMetadataCachesForTest();
	};

	it('matches public metadata responses', async () => {
		const redirectResult = await dispatch(
			new Request('https://fontsource.test/v1/download/abel', {
				redirect: 'manual',
			}),
		);
		await redirectResult.settle();

		expect({
			fontlist: await jsonSnapshot('https://fontsource.test/fontlist'),
			font: await jsonSnapshot('https://fontsource.test/v1/fonts/abel'),
			variable: await jsonSnapshot(
				'https://fontsource.test/v1/variable/recursive',
			),
			axisRegistry: await jsonSnapshot(
				'https://fontsource.test/v1/axis-registry?tag=mono',
			),
			version: await jsonSnapshot(
				'https://fontsource.test/v1/version/recursive',
			),
			stats: await jsonSnapshot('https://fontsource.test/v1/stats/recursive'),
			redirect: {
				status: redirectResult.response.status,
				headers: serializeHeaders(redirectResult.response),
			},
		}).toMatchSnapshot();
	});

	it('keeps API cache headers on conditional metadata responses', async () => {
		const first = await dispatch('https://fontsource.test/v1/fonts/abel');
		await first.settle();
		const etag = first.response.headers.get('ETag');

		expect(etag).toBeTruthy();

		const second = await dispatch(
			new Request('https://fontsource.test/v1/fonts/abel', {
				headers: {
					'If-None-Match': etag ?? '',
				},
			}),
		);
		await second.settle();

		expect(second.response.status).toBe(304);
		expect(second.response.headers.get('Cache-Control')).toBe(
			'public, max-age=300',
		);
		expect(second.response.headers.get('CDN-Cache-Control')).toBe(
			'max-age=86400',
		);
	});

	it('serves canonical download requests directly', async () => {
		const { response, settle } = await dispatch(
			new Request('https://fontsource.test/v1/download/abel', {
				redirect: 'manual',
			}),
		);
		await settle();

		expect(response.status).toBe(200);
		expect(response.headers.get('Location')).toBeNull();
		expect(response.headers.get('Content-Disposition')).toBe(
			'attachment; filename="abel_5.0.0.zip"',
		);
		expect(response.headers.get('Cache-Control')).toBe(
			'public, max-age=86400, stale-while-revalidate=604800',
		);
	});

	it('redirects legacy font download aliases to jsDelivr like the public API', async () => {
		const { response, settle } = await dispatch(
			new Request('https://fontsource.test/v1/fonts/abel/download.zip', {
				redirect: 'manual',
			}),
		);
		await settle();

		expect(response.status).toBe(301);
		expect(response.headers.get('Location')).toBe(
			'https://cdn.jsdelivr.net/fontsource/fonts/abel@latest/download.zip',
		);
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
	});

	it('redirects legacy font file aliases to the CDN', async () => {
		const { response, settle } = await dispatch(
			new Request(
				'https://fontsource.test/v1/fonts/abel/latin-400-normal.woff2',
				{
					redirect: 'manual',
				},
			),
		);
		await settle();

		expect(response.status).toBe(301);
		expect(response.headers.get('Location')).toBe(
			'https://cdn.jsdelivr.net/fontsource/fonts/abel@latest/latin-400-normal.woff2',
		);
	});

	it('describes the current deployment and production servers in openapi', async () => {
		const { response, settle } = await dispatch(
			'https://fontsource.test/openapi.json',
		);
		const document = (await response.json()) as {
			servers: Array<{ url: string; description: string }>;
		};
		await settle();

		expect(response.status).toBe(200);
		expect(document.servers).toEqual([
			{
				url: '/',
				description: 'Current deployment',
			},
			{
				url: 'https://api.fontsource.org',
				description: 'Production',
			},
		]);
	});

	it('documents every public route in openapi', async () => {
		const { response, settle } = await dispatch(
			'https://fontsource.test/openapi.json',
		);
		const document = (await response.json()) as {
			paths: Record<
				string,
				Record<string, { responses: Record<string, unknown> }>
			>;
		};
		await settle();

		expect(response.status).toBe(200);
		expect(Object.keys(document.paths).sort()).toEqual([
			'/css/{tag}/{file}',
			'/fontlist',
			'/fonts/{tag}/{file}',
			'/v1/axis-registry',
			'/v1/download/{id}',
			'/v1/fonts',
			'/v1/fonts/{id}',
			'/v1/fonts/{id}/{file}',
			'/v1/stats',
			'/v1/stats/{id}',
			'/v1/variable',
			'/v1/variable/{id}',
			'/v1/version/{id}',
		]);
		expect(document.paths['/v1/download/{id}']?.get.responses).toHaveProperty(
			'200',
		);
		expect(document.paths['/v1/download/{id}']?.get.responses).toHaveProperty(
			'304',
		);
		expect(document.paths['/fonts/{tag}/{file}']?.get.responses).toHaveProperty(
			'302',
		);
		expect(document.paths['/v1/fonts']?.get.responses).toHaveProperty('400');
		expect(document.paths['/v1/axis-registry']?.get.responses).toHaveProperty(
			'400',
		);
		expect(
			document.paths['/v1/fonts/{id}/{file}']?.get.responses,
		).toHaveProperty('301');
	});

	it('serves docs that load the generated openapi document', async () => {
		const { response, settle } = await dispatch('https://fontsource.test/docs');
		const body = await response.text();
		await settle();

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('text/html');
		expect(body).toContain('/openapi.json');
	});

	it('refreshes scheduled metadata caches from upstream', async () => {
		const ctrl = createScheduledController({
			cron: '0 */3 * * *',
			scheduledTime: new Date('2026-03-22T00:00:00.000Z'),
		});
		const ctx = createExecutionContext();
		await worker.scheduled(ctrl, testEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect({
			catalog: await testEnv.METADATA.get(KV_KEYS.catalog, { type: 'json' }),
			axisRegistry: await testEnv.METADATA.get(KV_KEYS.axisRegistry, {
				type: 'json',
			}),
			stats: await testEnv.METADATA.get(KV_KEYS.stats, { type: 'json' }),
		}).toMatchSnapshot();
	});

	it('rebuilds stats when upstream datasets are sparse', async () => {
		await testEnv.METADATA.delete(KV_KEYS.stats);
		expect(
			await jsonSnapshot('https://fontsource.test/v1/stats'),
		).toMatchSnapshot();
	});

	it('lists all variable fonts', async () => {
		expect(
			await jsonSnapshot('https://fontsource.test/v1/variable'),
		).toMatchSnapshot();
	});

	it('lists all stats', async () => {
		expect(
			await jsonSnapshot('https://fontsource.test/v1/stats'),
		).toMatchSnapshot();
	});

	it.each([
		[
			'/fontlist rejects unknown query parameters',
			'https://fontsource.test/fontlist?unknown',
		],
		[
			'/fontlist rejects unknown query parameters even with a valid key',
			'https://fontsource.test/fontlist?unknown&family',
		],
		[
			'/fontlist rejects multiple query parameters',
			'https://fontsource.test/fontlist?family&subsets',
		],
		[
			'/v1/fonts rejects unknown query parameters',
			'https://fontsource.test/v1/fonts?unknown=abel',
		],
		[
			'/v1/fonts rejects unknown query parameters even with a valid filter',
			'https://fontsource.test/v1/fonts?unknown=abel&id=abel',
		],
	] as const)('%s', async (_label, url) => {
		const { response, settle } = await dispatch(url);
		const body = (await response.json()) as { status: number; error: string };
		await settle();

		expect(response.status).toBe(400);
		expect(body.status).toBe(400);
		expect(body.error).toMatch(/^Bad Request\./);
	});

	it.each([
		[
			'returns the full registry when no query is provided',
			'',
			false,
			200,
			testAxisRegistry,
		],
		[
			'rejects invalid query keys',
			'?axis=mono',
			false,
			400,
			{ status: 400, error: 'Bad Request. Invalid query parameter.' },
		],
		[
			'filters by tag',
			'?tag=mono',
			true,
			200,
			{ MONO: expandedAxisRegistry.MONO },
		],
		[
			'filters by name',
			'?name=optical%20size',
			true,
			200,
			{ OPSZ: expandedAxisRegistry.OPSZ },
		],
		[
			'supports repeated query parameters',
			'?tag=mono&tag=opsz',
			true,
			200,
			expandedAxisRegistry,
		],
		[
			'supports comma-separated query values',
			'?tag=mono,opsz',
			true,
			200,
			expandedAxisRegistry,
		],
		[
			'rejects invalid keys when valid filters are present',
			'?axis=mono&tag=opsz',
			true,
			400,
			{ status: 400, error: 'Bad Request. Invalid query parameter.' },
		],
		[
			'preserves legacy query semantics',
			'?tag=mono&name=Optical%20Size',
			true,
			200,
			expandedAxisRegistry,
		],
		[
			'returns 404 when filters do not match',
			'?tag=wdth',
			true,
			404,
			{ status: 404, error: 'Not Found. No matching axis found.' },
		],
	] as const)('axis-registry: %s', async (_label, query, needsExpanded, expectedStatus, expectedBody) => {
		if (needsExpanded) {
			await seedAxisRegistry();
		}
		const { response, settle } = await dispatch(
			`https://fontsource.test/v1/axis-registry${query}`,
		);
		const body = await response.json();
		await settle();
		expect(response.status).toBe(expectedStatus);
		expect(body).toEqual(expectedBody);
	});

	it.each([
		['applies repeated filters sequentially', '?id=abel&id=recursive', 200, []],
	])('font filters: %s', async (_label, query, expectedStatus, expectedIds) => {
		const { response, settle } = await dispatch(
			`https://fontsource.test/v1/fonts${query}`,
		);
		const body = (await response.json()) as { id: string }[];
		await settle();
		expect(response.status).toBe(expectedStatus);
		expect(body.map((f) => f.id).sort()).toEqual(expectedIds.sort());
	});

	it.each([
		[
			'defaults to type values',
			'',
			200,
			{ abel: 'google', recursive: 'google', familypack: 'google' },
		],
		[
			'rejects multiple query parameters',
			'?type=google&type=other',
			400,
			{
				status: 400,
				error: 'Bad Request. You can only use one query parameter.',
			},
		],
	] as const)('fontlist: %s', async (_label, query, expectedStatus, expectedBody) => {
		const { response, settle } = await dispatch(
			`https://fontsource.test/fontlist${query}`,
		);
		const body = await response.json();
		await settle();
		expect(response.status).toBe(expectedStatus);
		expect(body).toEqual(expectedBody);
	});
});
