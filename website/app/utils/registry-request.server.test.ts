import { data } from 'react-router';
import { describe, expect, it } from 'vitest';

import { loadOptionalRegistryData } from './registry-request.server';

describe('loadOptionalRegistryData', () => {
	it('returns available data', async () => {
		await expect(
			loadOptionalRegistryData(Promise.resolve({ family: 'Fraunces' })),
		).resolves.toEqual({
			value: { family: 'Fraunces' },
			state: 'available',
		});
	});

	it('distinguishes a missing registry record from an outage', async () => {
		await expect(
			loadOptionalRegistryData(
				Promise.reject(data({ status: 404 }, { status: 404 })),
			),
		).resolves.toEqual({ state: 'not-found' });

		await expect(
			loadOptionalRegistryData(
				Promise.reject(data({ status: 502 }, { status: 502 })),
			),
		).resolves.toEqual({ state: 'unavailable' });
	});

	it('preserves request cancellation', async () => {
		const controller = new AbortController();
		controller.abort();
		const error = new DOMException('The request was aborted', 'AbortError');

		await expect(
			loadOptionalRegistryData(Promise.reject(error), controller.signal),
		).rejects.toBe(error);
	});
});
