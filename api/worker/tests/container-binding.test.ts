import { describe, expect, it } from 'vitest';
import { readBuildErrorMessage } from '../worker/src/container/binding';

describe('container binding error parsing', () => {
	it('prefers structured JSON error messages', async () => {
		const response = new Response(
			JSON.stringify({ error: 'builder exploded' }),
			{
				status: 500,
				statusText: 'Internal Server Error',
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);

		await expect(readBuildErrorMessage(response)).resolves.toBe(
			'builder exploded',
		);
	});

	it('returns plain-text bodies without reading the stream twice', async () => {
		const response = new Response('plain boom', {
			status: 500,
			statusText: 'Internal Server Error',
		});

		await expect(readBuildErrorMessage(response)).resolves.toBe('plain boom');
	});

	it('falls back to the HTTP status text when the body is empty', async () => {
		const response = new Response(null, {
			status: 500,
			statusText: 'Internal Server Error',
		});

		await expect(readBuildErrorMessage(response)).resolves.toBe(
			'Internal Server Error',
		);
	});
});
