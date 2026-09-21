import { data } from 'react-router';
import { describe, expect, it } from 'vitest';

import {
	loadOptionalRegistryData,
	loadRequiredRegistryData,
} from './registry-request.server';

describe('loadOptionalRegistryData', () => {
	it('returns available data', async () => {
		await expect(
			loadOptionalRegistryData(Promise.resolve({ family: 'Fraunces' })),
		).resolves.toEqual({ family: 'Fraunces' });
	});

	it('omits missing optional data but exposes outages', async () => {
		await expect(
			loadOptionalRegistryData(
				Promise.reject(data({ status: 404 }, { status: 404 })),
			),
		).resolves.toBeUndefined();

		await expect(
			loadOptionalRegistryData(
				Promise.reject(data({ status: 502 }, { status: 502 })),
			),
		).rejects.toMatchObject({ status: 503 });
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

describe('loadRequiredRegistryData', () => {
	it('returns required data', async () => {
		await expect(
			loadRequiredRegistryData(Promise.resolve({ family: 'Fraunces' })),
		).resolves.toEqual({ family: 'Fraunces' });
	});

	it('maps missing data and outages to route responses', async () => {
		await expect(
			loadRequiredRegistryData(
				Promise.reject(data({ status: 404 }, { status: 404 })),
				undefined,
				'Font registry record',
			),
		).rejects.toMatchObject({ status: 404 });

		await expect(
			loadRequiredRegistryData(
				Promise.reject(data({ status: 502 }, { status: 502 })),
			),
		).rejects.toMatchObject({ status: 503 });
	});

	it('preserves cancellation', async () => {
		const controller = new AbortController();
		controller.abort();
		const error = new DOMException('The request was aborted', 'AbortError');

		await expect(
			loadRequiredRegistryData(Promise.reject(error), controller.signal),
		).rejects.toBe(error);
	});
});
