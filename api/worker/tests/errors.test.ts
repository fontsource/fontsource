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

		// Unknown route
		[
			'GET /unknown uses 404 handler',
			'https://fontsource.test/some/random/path',
			404,
			'Not Found',
		],
	])('%s returns %i', async (_label, url, expectedStatus, errorContains) => {
		const { response, settle } = await dispatch(url);
		const body = (await response.json()) as { status: number; error: string };
		await settle();

		expect(response.status).toBe(expectedStatus);
		expect(body.status).toBe(expectedStatus);
		expect(body.error.toLowerCase()).toContain(errorContains.toLowerCase());
	});
});
