import { app } from './app';

export { ArtifactBuilder } from './container/binding';

import { METADATA_CRON, STATS_CRON } from './constants';
import { parseEnv } from './env';
import {
	refreshAxisRegistry,
	refreshCatalog,
	refreshStats,
} from './features/metadata/refresh';
import {
	consumeStatsQueue,
	scheduleStatsRefresh,
	type StatsQueueMessage,
} from './features/metadata/stats/ingest';

/**
 * Worker entrypoint.
 *
 * `fetch` serves the public API/CDN surface, `scheduled` refreshes metadata and
 * enqueues stats packages, and `queue` persists provider data.
 */
const worker = {
	fetch: async (
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> => {
		parseEnv(env);
		return app.fetch(request, env, ctx);
	},

	scheduled: async (
		event: ScheduledController,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<void> => {
		parseEnv(env);

		if (event.cron === STATS_CRON) {
			await scheduleStatsRefresh(env);
			return;
		}

		if (event.cron === METADATA_CRON) {
			await Promise.all([
				refreshCatalog(env),
				refreshAxisRegistry(env),
				refreshStats(env),
			]);
		}
	},

	queue: async (
		batch: MessageBatch<StatsQueueMessage>,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<void> => {
		parseEnv(env);
		await consumeStatsQueue(batch, env);
	},
} satisfies ExportedHandler<Env, StatsQueueMessage>;

export default worker;
