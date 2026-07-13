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
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-07-12T00:00:00.000Z'));
		await setupWorkerTest();
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
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
			npm_monthly: 42,
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
		vi.setSystemTime(new Date('2027-01-08T00:00:00.000Z'));

		await processQueueMessage();

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
		vi.spyOn(scheduler, 'wait').mockResolvedValue();
		installUpstreamFetchMock({
			'https://api.npmjs.org/downloads/point/last-month/%40fontsource%2Fabel':
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
				'Stats upstream 500: https://api.npmjs.org/downloads/point/last-month/%40fontsource%2Fabel',
			last_success_at: null,
		});
		expect(result).toMatchObject({
			explicitAcks: [],
			retryMessages: [{ msgId: 'message-1' }],
		});
	});

	it('parks missing scoped packages until the next catalog seed', async () => {
		await seedStatsPackages(testEnv, testCatalog);
		const readActive = () =>
			testEnv.STATS.prepare(
				`SELECT active FROM stats_packages WHERE package_name = ?`,
			)
				.bind('@fontsource/abel')
				.first<number>('active');
		installUpstreamFetchMock({
			'https://registry.npmjs.org/%40fontsource%2Fabel': new Response('', {
				status: 404,
			}),
		});

		const result = await processQueueMessage();

		expect(result).toMatchObject({
			explicitAcks: ['message-1'],
			retryMessages: [],
		});
		expect(await readActive()).toBe(0);

		await seedStatsPackages(testEnv, testCatalog);
		expect(await readActive()).toBe(1);
	});

	it('paces npm requests and backs off rate limits in-process', async () => {
		const wait = vi.spyOn(scheduler, 'wait').mockResolvedValue();
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.mocked(globalThis.fetch)
			.mockResolvedValueOnce(new Response('', { status: 429 }))
			.mockResolvedValueOnce(
				new Response('', {
					status: 429,
					headers: { 'Retry-After': '7' },
				}),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						downloads: [{ day: '2026-07-12', downloads: 1 }],
					}),
				),
			);

		await expect(
			fetchNpmDownloads('@fontsource/abel', 2026, '2026-07-12', '2026-07-12'),
		).resolves.toBe(1);
		expect(wait.mock.calls.map(([delay]) => delay)).toEqual([
			500, 5000, 500, 7000, 500,
		]);
	});

	it('resumes an initial backfill from completed historical periods', async () => {
		await seedStatsPackages(testEnv, testCatalog);
		vi.spyOn(scheduler, 'wait').mockResolvedValue();
		const currentYearUrl =
			'https://api.npmjs.org/downloads/range/2026-01-01:2026-07-12/%40fontsource%2Fabel';
		installUpstreamFetchMock({
			[currentYearUrl]: new Response('{}', { status: 500 }),
		});

		const firstResult = await processQueueMessage();
		const checkpoint = await testEnv.STATS.prepare(
			`SELECT p.created_day, p.last_success_at, s.total
			FROM stats_packages p
			JOIN stats_periods s ON s.package_name = p.package_name
			WHERE p.package_name = ? AND s.provider = 'npm' AND s.year = 2025`,
		)
			.bind('@fontsource/abel')
			.first<{
				created_day: string | null;
				last_success_at: string | null;
				total: number;
			}>();

		expect(firstResult).toMatchObject({
			explicitAcks: [],
			retryMessages: [{ msgId: 'message-1' }],
		});
		expect(checkpoint).toEqual({
			created_day: '2025-01-01',
			last_success_at: null,
			total: 365,
		});

		const historicalYearUrl =
			'https://api.npmjs.org/downloads/range/2025-01-01:2025-12-31/%40fontsource%2Fabel';
		installUpstreamFetchMock({
			[historicalYearUrl]: new Response('{}', { status: 500 }),
		});
		const secondResult = await processQueueMessage();
		const completed = await testEnv.STATS.prepare(
			`SELECT last_success_at, last_error FROM stats_packages
			WHERE package_name = ?`,
		)
			.bind('@fontsource/abel')
			.first<{ last_success_at: string | null; last_error: string | null }>();

		expect(secondResult).toMatchObject({
			explicitAcks: ['message-1'],
			retryMessages: [],
		});
		expect(completed?.last_success_at).toBeTruthy();
		expect(completed?.last_error).toBeNull();
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
