import { AwsClient } from 'aws4fetch';
import { expect, it, vi } from 'vitest';

it('includes a checksum on container uploads for release artifact reuse', async () => {
	vi.stubEnv('R2_S3_ENDPOINT', 'https://r2.test');
	vi.stubEnv('FONTS_BUCKET_NAME', 'fontsource-artifacts');
	vi.stubEnv('R2_ACCESS_KEY_ID', 'test');
	vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test');
	const fetch = vi
		.spyOn(AwsClient.prototype, 'fetch')
		.mockResolvedValue(new Response(null));
	try {
		const { putObject } = await import('./src/r2');
		await putObject('abel@6.0.0/font.woff2', new TextEncoder().encode('abc'), {
			contentType: 'font/woff2',
		});
		const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
		expect(headers.get('x-amz-meta-sha256')).toBe(
			'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
		);
		expect(headers.get('Content-Length')).toBe('3');
		expect(headers.get('Content-Type')).toBe('font/woff2');
	} finally {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		vi.resetModules();
	}
});
