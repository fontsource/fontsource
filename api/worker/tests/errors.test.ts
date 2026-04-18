import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatch, setupWorkerTest } from './helpers';

describe('error responses', () => {
	beforeEach(async () => {
		await setupWorkerTest();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each([
		// Metadata 404s — non-existent font ID
		[
			'GET /v1/fonts/:id — non-existent font',
			'https://fontsource.test/v1/fonts/notafont',
			404,
			'does not exist',
		],
		[
			'GET /v1/variable/:id — static font',
			'https://fontsource.test/v1/variable/abel',
			404,
			'not found',
		],
		[
			'GET /v1/variable/:id — non-existent font',
			'https://fontsource.test/v1/variable/notafont',
			404,
			'not found',
		],
		[
			'GET /v1/stats/:id — non-existent font',
			'https://fontsource.test/v1/stats/notafont',
			404,
			'does not exist',
		],
		[
			'GET /v1/version/:id — non-existent font',
			'https://fontsource.test/v1/version/notafont',
			404,
			'does not exist',
		],

		// CDN 404s — non-existent file for a real font
		[
			'GET /fonts/:tag/:file — non-existent file',
			'https://fontsource.test/fonts/abel@1.0.0/latin-700-normal.woff2',
			404,
			'does not exist',
		],

		// CDN 400s — invalid file extension
		[
			'GET /fonts/:tag/:file — invalid extension',
			'https://fontsource.test/fonts/abel@1.0.0/latin-400-normal.js',
			400,
			'Invalid file extension',
		],

		// Unknown route
		[
			'GET /unknown — 404 handler',
			'https://fontsource.test/some/random/path',
			404,
			'Not Found',
		],
	])('%s → %i', async (_label, url, expectedStatus, errorContains) => {
		const { response, settle } = await dispatch(url);
		const body = (await response.json()) as { status: number; error: string };
		await settle();

		expect(response.status).toBe(expectedStatus);
		expect(body.status).toBe(expectedStatus);
		expect(body.error.toLowerCase()).toContain(errorContains.toLowerCase());
	});
});
