import {
	createExecutionContext,
	createScheduledController,
	waitOnExecutionContext,
} from 'cloudflare:test';
import { gunzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STATS_CRON } from '../worker/src/constants';
import worker from '../worker/src/index';
import { dispatch, setupWorkerTest, testEnv } from './helpers';

describe('error responses', () => {
	beforeEach(async () => {
		await setupWorkerTest();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it.each([200, 400])(
		'reports a request failure even when PostHog returns %i',
		async (posthogStatus) => {
			vi.stubEnv('PROD', true);
			vi.spyOn(testEnv.METADATA, 'get').mockRejectedValue(
				new Error('KV unavailable'),
			);
			const capture = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValue(new Response('{}', { status: posthogStatus }));
			const { response, settle } = await dispatch(
				new Request('https://fontsource.test/v1/fonts', {
					headers: { Authorization: 'Bearer private-value' },
				}),
			);
			await settle();
			expect(response.status).toBe(500);
			expect(response.headers.get('Cache-Control')).toBe('no-store');
			expect(capture).toHaveBeenCalledTimes(1);
			const [url, options] = capture.mock.calls[0] ?? [];
			expect(String(url)).toContain('https://eu.i.posthog.com/');
			const payload = JSON.parse(
				gunzipSync(await new Response(options?.body).arrayBuffer()).toString(),
			);
			expect(payload.batch[0]).toMatchObject({
				event: '$exception',
				properties: {
					source: 'api-worker',
					handler: 'fetch',
					pathname: '/v1/fonts',
					method: 'GET',
					$process_person_profile: false,
				},
			});
			expect(JSON.stringify(payload)).not.toContain('private-value');
		},
	);

	it('reports scheduled failures without swallowing them', async () => {
		vi.stubEnv('PROD', true);
		const error = new Error('KV unavailable');
		vi.spyOn(testEnv.METADATA, 'get').mockRejectedValue(error);
		const capture = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response('{}'));
		const ctx = createExecutionContext();
		await expect(
			worker.scheduled(
				createScheduledController({ cron: STATS_CRON }),
				testEnv,
				ctx,
			),
		).rejects.toThrow(error);
		await waitOnExecutionContext(ctx);
		const payload = JSON.parse(
			gunzipSync(
				await new Response(capture.mock.calls[0]?.[1]?.body).arrayBuffer(),
			).toString(),
		);
		expect(payload.batch[0].properties).toMatchObject({
			handler: 'scheduled',
			cron: STATS_CRON,
		});
	});

	it('does not report local development failures', async () => {
		vi.spyOn(testEnv.METADATA, 'get').mockRejectedValue(
			new Error('KV unavailable'),
		);
		const capture = vi.spyOn(globalThis, 'fetch');
		const { response, settle } = await dispatch(
			'https://fontsource.test/v1/fonts',
		);
		await settle();
		expect(response.status).toBe(500);
		expect(capture).not.toHaveBeenCalled();
	});

	it.each([
		// Metadata 404s for missing font IDs
		[
			'GET /v1/fonts/:id for missing font',
			'https://fontsource.test/v1/fonts/notafont',
			404,
			'does not exist',
		],
		[
			'GET /v1/variable/:id for static font',
			'https://fontsource.test/v1/variable/abel',
			404,
			'not found',
		],
		[
			'GET /v1/variable/:id for missing font',
			'https://fontsource.test/v1/variable/notafont',
			404,
			'not found',
		],
		[
			'GET /v1/stats/:id for missing font',
			'https://fontsource.test/v1/stats/notafont',
			404,
			'does not exist',
		],
		[
			'GET /v1/version/:id for missing font',
			'https://fontsource.test/v1/version/notafont',
			404,
			'does not exist',
		],

		// CDN 404s for missing files on real fonts
		[
			'GET /fonts/:tag/:file for missing file',
			'https://fontsource.test/fonts/abel@5.0.0/latin-700-normal.woff2',
			404,
			'does not exist',
		],

		// CDN 400s for invalid requests
		[
			'GET /fonts/:tag/:file with invalid extension',
			'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.js',
			400,
			'Invalid file extension',
		],
		[
			'GET /fonts/:tag/:file with unsupported version',
			'https://fontsource.test/fonts/abel@4.0.0/latin-400-normal.woff2',
			400,
			'Version tags below @5 are not supported',
		],
		[
			'GET /v1/stats/badge/:metric with invalid metric',
			'https://fontsource.test/v1/stats/badge/weekly',
			400,
			'Bad Request',
		],

		// Unknown route
		[
			'GET /unknown uses 404 handler',
			'https://fontsource.test/some/random/path',
			404,
			'Not Found',
		],
	])('%s returns %i', async (_label, url, expectedStatus, errorContains) => {
		vi.stubEnv('PROD', true);
		const capture = vi.spyOn(globalThis, 'fetch');
		const { response, settle } = await dispatch(url);
		const body = (await response.json()) as { status: number; error: string };
		await settle();

		expect(
			capture.mock.calls.some(([url]) => String(url).includes('posthog.com')),
		).toBe(false);
		expect(response.status).toBe(expectedStatus);
		expect(body.status).toBe(expectedStatus);
		expect(body.error.toLowerCase()).toContain(errorContains.toLowerCase());
		const expectedCacheControl =
			expectedStatus === 404 ? 'public, max-age=60' : 'no-store';
		expect(response.headers.get('Cache-Control')).toBe(expectedCacheControl);
		expect(response.headers.get('CDN-Cache-Control')).toBe(
			expectedCacheControl,
		);
		expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toBe(
			expectedCacheControl,
		);
	});
});
