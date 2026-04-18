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
			'attachment; filename="abel_1.0.0.zip"',
		);
		expect(response.headers.get('Cache-Control')).toBe(
			'public, max-age=300, stale-while-revalidate=86400',
		);
	});

	it('redirects legacy font download aliases to the canonical download endpoint', async () => {
		const { response, settle } = await dispatch(
			new Request('https://fontsource.test/v1/fonts/abel/download.zip', {
				redirect: 'manual',
			}),
		);
		await settle();

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe(
			'https://api.fontsource.org/v1/download/abel',
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
			'returns the full registry when no query is provided',
			'',
			false,
			200,
			testAxisRegistry,
		],
		['ignores invalid query keys', '?axis=mono', false, 200, testAxisRegistry],
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
			'ignores invalid keys when valid filters are present',
			'?axis=mono&tag=opsz',
			true,
			200,
			{ OPSZ: expandedAxisRegistry.OPSZ },
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
		[
			'ignores invalid query keys',
			'?axis=mono',
			200,
			['abel', 'recursive', 'familypack'],
		],
		[
			'ignores invalid keys when valid filters are present',
			'?axis=mono&id=recursive',
			200,
			['recursive'],
		],
		[
			'uses the last repeated filter value',
			'?id=abel&id=recursive',
			200,
			['recursive'],
		],
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
			'ignores invalid query keys',
			'?axis=mono',
			200,
			{ abel: 'google', recursive: 'google', familypack: 'google' },
		],
		[
			'ignores invalid keys when a valid key is present',
			'?axis=mono&family=1',
			200,
			{ abel: 'Abel', recursive: 'Recursive', familypack: 'Family Pack' },
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
