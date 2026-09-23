import { data } from 'react-router';
import { describe, expect, it } from 'vitest';

import {
	loadOptionalRegistryData,
	loadRequiredRegistryData,
} from './registry-request.server';

describe('loadOptionalRegistryData', () => {
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
});

describe('loadRequiredRegistryData', () => {
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
});
