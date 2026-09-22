import {
	createExecutionContext,
	createMessageBatch,
	createScheduledController,
	getQueueResult,
} from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import legacyFontIds from '../shared/legacy-fonts.json';
import { STATS_CRON } from '../worker/src/constants';
import type { StatsQueueMessage } from '../worker/src/features/metadata/stats/ingest';
import { fetchNpmDownloads } from '../worker/src/features/metadata/stats/providers';
import { seedStatsPackages } from '../worker/src/features/metadata/stats/repository';
import worker from '../worker/src/index';
import { testCatalog } from './fixtures/metadata';
import { dispatch, setupWorkerTest, testEnv } from './helpers';
import { mockUpstreamResponses } from './network';

const processQueueMessage = async (packageName = '@fontsource/abel') => {
	const batch = createMessageBatch<StatsQueueMessage>('fontsource-stats', [
		{
			id: 'message-1',
			timestamp: new Date(),
			body: { packageName },
			attempts: 1,
		},
	]);
	const ctx = createExecutionContext();
	await worker.queue(batch, testEnv, ctx);
	return getQueueResult(batch, ctx);
};

describe('download stats ingestion', () => {
	beforeEach(async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-07-12T00:00:00.000Z'));
		await setupWorkerTest();
	});
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('seeds the complete package set from the daily cron', async () => {
		await worker.scheduled(
			createScheduledController({
				cron: STATS_CRON,
				scheduledTime: new Date('2026-07-12T00:15:00.000Z'),
			}),
			testEnv,
			createExecutionContext(),
		);

		const state = await testEnv.STATS.prepare(
			`SELECT COUNT(*) AS packages, SUM(active) AS active
			FROM stats_packages`,
		).first<{ packages: number; active: number }>();
		const packageCount =
			Object.keys(testCatalog).length +
			Object.values(testCatalog).filter((font) => font.variable).length +
			legacyFontIds.length;

		expect(state).toEqual({ packages: packageCount, active: packageCount });
	});

	it('stores a complete package refresh idempotently', async () => {
		await seedStatsPackages(testEnv, testCatalog);
		vi.spyOn(scheduler, 'wait').mockResolvedValue();
		const firstResult = await processQueueMessage();
		const secondResult = await processQueueMessage();

		const { response, settle } = await dispatch(
			'https://fontsource.test/v1/stats/abel',
		);
		await settle();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			static: {
				npmDownloadMonthly: 42,
				npmDownloadTotal: 558,
				jsDelivrHitsMonthly: 20,
				jsDelivrHitsTotal: 400,
			},
			total: {
				npmDownloadMonthly: 42,
				npmDownloadTotal: 558,
				jsDelivrHitsMonthly: 20,
				jsDelivrHitsTotal: 400,
			},
		});
		expect([firstResult, secondResult]).toMatchObject([
			{ explicitAcks: ['message-1'], retryMessages: [] },
			{ explicitAcks: ['message-1'], retryMessages: [] },
		]);
	});

	it('retries the package message after an upstream failure', async () => {
		await seedStatsPackages(testEnv, testCatalog);
		vi.spyOn(scheduler, 'wait').mockResolvedValue();
		mockUpstreamResponses({
			'https://api.npmjs.org/downloads/point/last-month/%40fontsource%2Fabel':
				new Response('{}', { status: 500 }),
		});
		const result = await processQueueMessage();

		expect(result).toMatchObject({
			explicitAcks: [],
			retryMessages: [{ msgId: 'message-1' }],
		});
	});

	it('rejects silently truncated npm ranges', async () => {
		mockUpstreamResponses({
			'https://api.npmjs.org/downloads/range/2026-01-01:2026-07-12/%40fontsource%2Fabel':
				new Response(
					JSON.stringify({
						downloads: [{ day: '2026-01-01', downloads: 1 }],
					}),
				),
		});

		await expect(
			fetchNpmDownloads('@fontsource/abel', 2026, '2026-01-01', '2026-07-12'),
		).rejects.toThrow(
			'Incomplete npm stats range for @fontsource/abel: 2026-01-01:2026-07-12',
		);
	});
});
