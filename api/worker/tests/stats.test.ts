import {
	createExecutionContext,
	createMessageBatch,
	createScheduledController,
	getQueueResult,
} from 'cloudflare:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import legacyFontIds from '../shared/legacy-fonts.json';
import { STATS_CRON } from '../worker/src/constants';
import type { StatsQueueMessage } from '../worker/src/features/metadata/stats/ingest';
import { fetchNpmDownloads } from '../worker/src/features/metadata/stats/providers';
import { seedStatsPackages } from '../worker/src/features/metadata/stats/repository';
import worker from '../worker/src/index';
import {
	installUpstreamFetchMock,
	setupWorkerTest,
	testCatalog,
	testEnv,
} from './helpers';

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
		await setupWorkerTest();
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

		const packageRow = await testEnv.STATS.prepare(
			`SELECT npm_monthly, jsdelivr_monthly, last_success_at
			FROM stats_packages WHERE package_name = ?`,
		)
			.bind('@fontsource/abel')
			.first<{
				npm_monthly: number;
				jsdelivr_monthly: number;
				last_success_at: string | null;
			}>();
		const periods = await testEnv.STATS.prepare(
			`SELECT provider, year, total FROM stats_periods
			WHERE package_name = ? ORDER BY provider, year`,
		)
			.bind('@fontsource/abel')
			.all<{ provider: string; year: number; total: number }>();

		expect(packageRow).toMatchObject({
			npm_monthly: 30,
			jsdelivr_monthly: 20,
		});
		expect(packageRow?.last_success_at).toBeTruthy();
		expect(periods.results).toEqual([
			{ provider: 'jsdelivr', year: 2025, total: 200 },
			{ provider: 'jsdelivr', year: 2026, total: 200 },
			{ provider: 'npm', year: 2025, total: 365 },
			{ provider: 'npm', year: 2026, total: 193 },
		]);
		expect([firstResult, secondResult]).toMatchObject([
			{ explicitAcks: ['message-1'], retryMessages: [] },
			{ explicitAcks: ['message-1'], retryMessages: [] },
		]);
	});

	it('refinalizes the previous calendar year throughout January', async () => {
		await seedStatsPackages(testEnv, testCatalog);
		await testEnv.STATS.prepare(
			`UPDATE stats_packages
			SET created_day = ?, last_success_at = ?
			WHERE package_name = ?`,
		)
			.bind('2025-01-01', '2026-12-25T00:00:00.000Z', '@fontsource/abel')
			.run();
		vi.spyOn(scheduler, 'wait').mockResolvedValue();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2027-01-08T00:00:00.000Z'));

		try {
			await processQueueMessage();
		} finally {
			vi.useRealTimers();
		}

		const periods = await testEnv.STATS.prepare(
			`SELECT provider, year FROM stats_periods
			WHERE package_name = ? ORDER BY provider, year`,
		)
			.bind('@fontsource/abel')
			.all<{ provider: string; year: number }>();

		expect(periods.results).toEqual([
			{ provider: 'jsdelivr', year: 2026 },
			{ provider: 'jsdelivr', year: 2027 },
			{ provider: 'npm', year: 2026 },
			{ provider: 'npm', year: 2027 },
		]);
	});

	it('deactivates scoped packages removed from the catalog', async () => {
		await seedStatsPackages(testEnv, testCatalog);
		await seedStatsPackages(testEnv, { abel: testCatalog.abel });

		const packages = await testEnv.STATS.prepare(
			`SELECT package_name, active FROM stats_packages
			WHERE package_name IN (?, ?, ?, ?)
			ORDER BY package_name`,
		)
			.bind(
				'@fontsource/abel',
				'@fontsource/recursive',
				'@fontsource-variable/recursive',
				'fontsource-abel',
			)
			.all<{ package_name: string; active: number }>();

		expect(packages.results).toEqual([
			{ package_name: '@fontsource-variable/recursive', active: 0 },
			{ package_name: '@fontsource/abel', active: 1 },
			{ package_name: '@fontsource/recursive', active: 0 },
			{ package_name: 'fontsource-abel', active: 1 },
		]);
	});

	it('records upstream failures and retries the package message', async () => {
		await seedStatsPackages(testEnv, testCatalog);
		installUpstreamFetchMock({
			'https://api.npmjs.org/downloads/range/2026-06-13:2026-07-12/%40fontsource%2Fabel':
				new Response('{}', { status: 500 }),
		});
		const result = await processQueueMessage();

		const failed = await testEnv.STATS.prepare(
			`SELECT last_error, last_success_at FROM stats_packages
			WHERE package_name = ?`,
		)
			.bind('@fontsource/abel')
			.first<{ last_error: string | null; last_success_at: string | null }>();
		expect(failed).toMatchObject({
			last_error:
				'Stats upstream 500: https://api.npmjs.org/downloads/range/2026-06-13:2026-07-12/%40fontsource%2Fabel',
			last_success_at: null,
		});
		expect(result).toMatchObject({
			explicitAcks: [],
			retryMessages: [{ msgId: 'message-1' }],
		});
	});

	it('rejects silently truncated npm ranges', async () => {
		installUpstreamFetchMock({
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
