import type { Context } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DERIVED_METADATA_CACHE_TTL_MS,
	KV_KEYS,
} from '../worker/src/constants';
import type { AppEnv } from '../worker/src/env';
import {
	clearMetadataCachesForTest,
	getFontIndex,
	getVariableCatalog,
} from '../worker/src/features/metadata/store';
import {
	scheduledCatalog,
	seedMetadata,
	testCatalog,
	testEnv,
} from './helpers';

const createStoreContext = (): Context<AppEnv> =>
	({ env: testEnv }) as unknown as Context<AppEnv>;

/** Tests the in-memory derived metadata cache layer that sits in front of KV,
 *  verifying warm-hit reuse, explicit invalidation, and TTL-based expiry. */
describe('metadata store derived cache', () => {
	beforeEach(async () => {
		clearMetadataCachesForTest();
		vi.useRealTimers();
		await seedMetadata(testEnv);
	});

	afterEach(() => {
		clearMetadataCachesForTest();
		vi.useRealTimers();
	});

	it('reuses the warm font index across requests until the ttl expires', async () => {
		const warmContext = createStoreContext();
		const warmIndex = await getFontIndex(warmContext);

		await testEnv.METADATA.put(
			KV_KEYS.catalog,
			JSON.stringify(scheduledCatalog),
		);

		const secondContext = createStoreContext();
		const cachedIndex = await getFontIndex(secondContext);

		expect(warmIndex).toHaveLength(3);
		expect(cachedIndex).toHaveLength(3);
		expect(cachedIndex).toEqual(warmIndex);
	});

	it('clears the derived cache explicitly for tests', async () => {
		await getVariableCatalog(createStoreContext());
		await testEnv.METADATA.put(
			KV_KEYS.catalog,
			JSON.stringify(scheduledCatalog),
		);

		clearMetadataCachesForTest();

		const refreshedCatalog = await getVariableCatalog(createStoreContext());

		expect(refreshedCatalog).toEqual({});
	});

	it('expires the derived cache after the configured ttl', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-05T00:00:00.000Z'));

		const warmIndex = await getFontIndex(createStoreContext());
		await testEnv.METADATA.put(
			KV_KEYS.catalog,
			JSON.stringify({
				...testCatalog,
				abel: {
					...testCatalog.abel,
					family: 'Abel Updated',
				},
			}),
		);

		vi.advanceTimersByTime(DERIVED_METADATA_CACHE_TTL_MS + 1);

		const refreshedIndex = await getFontIndex(createStoreContext());
		const abel = refreshedIndex.find((item) => item.id === 'abel');

		expect(warmIndex.find((item) => item.id === 'abel')?.family).toBe('Abel');
		expect(abel?.family).toBe('Abel Updated');
	});
});
