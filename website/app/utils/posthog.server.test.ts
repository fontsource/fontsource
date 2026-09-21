import { gunzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureServerError } from './posthog.server';

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('server error reporting', () => {
	it('sends an anonymous exception through the proxy without request secrets', async () => {
		vi.stubEnv('PROD', true);
		const fetch = vi.fn().mockResolvedValue(new Response('{}'));
		vi.stubGlobal('fetch', fetch);
		const secret = crypto.randomUUID();

		await captureServerError(
			new Error('Registry unavailable'),
			new Request(`https://fontsource.org/fonts/inter?token=${secret}`, {
				method: 'POST',
				headers: { authorization: `Bearer ${secret}` },
				body: secret,
			}),
		);

		expect(fetch).toHaveBeenCalledOnce();
		const call = fetch.mock.calls[0];
		if (!call) throw new Error('Missing exception request');
		const [url, options] = call;
		expect(new URL(url).origin).toBe('https://a.fontsource.org');
		const body = gunzipSync(options.body).toString();
		const payload = JSON.parse(body);
		expect(payload.batch[0]).toMatchObject({
			event: '$exception',
			properties: {
				$process_person_profile: false,
				$geoip_disable: true,
				pathname: '/fonts/inter',
				method: 'POST',
				$exception_list: [{ type: 'Error', value: 'Registry unavailable' }],
			},
		});
		expect(body).not.toContain(secret);
	});

	it('skips development, expected client errors, and aborted requests', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		const request = new Request('https://fontsource.org/missing');
		vi.stubEnv('PROD', false);
		await captureServerError(new Error('Development'), request);
		vi.stubEnv('PROD', true);
		await captureServerError(new Response(null, { status: 404 }), request);
		await captureServerError(
			{ status: 404, statusText: 'Not Found', data: null, internal: false },
			request,
		);
		await captureServerError(
			new Error('Aborted'),
			new Request(request, {
				signal: AbortSignal.abort(),
			}),
		);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('does not replace the application failure when reporting is rejected', async () => {
		vi.stubEnv('PROD', true);
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response(null, { status: 400 })),
		);
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		await expect(
			captureServerError(
				new Error('Application failure'),
				new Request('https://fontsource.org/fonts/inter'),
			),
		).resolves.toBeUndefined();
		expect(log).toHaveBeenCalledWith(
			'Failed to report server error to PostHog',
			expect.any(Error),
		);
	});
});
