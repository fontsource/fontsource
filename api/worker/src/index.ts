import { app } from './app';
import { captureApiError } from './utils/posthog';

export { ArtifactBuilder } from './container/binding';

import { METADATA_CRON, STATS_CRON } from './constants';
import { parseEnv } from './env';
import {
	refreshAxisRegistry,
	refreshCatalog,
} from './features/metadata/refresh';
import {
	consumeStatsQueue,
	type StatsQueueMessage,
	scheduleStatsRefresh,
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
		try {
			parseEnv(env);
			return await app.fetch(request, env, ctx);
		} catch (error) {
			if (!request.signal.aborted) {
				ctx.waitUntil(
					captureApiError(error, {
						handler: 'fetch',
						pathname: new URL(request.url).pathname,
						method: request.method,
					}),
				);
			}
			throw error;
		}
	},

	scheduled: async (
		event: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> => {
		try {
			parseEnv(env);

			if (event.cron === STATS_CRON) {
				await scheduleStatsRefresh(env);
				return;
			}

			if (event.cron === METADATA_CRON) {
				await Promise.all([refreshCatalog(env), refreshAxisRegistry(env)]);
			}
		} catch (error) {
			ctx.waitUntil(
				captureApiError(error, { handler: 'scheduled', cron: event.cron }),
			);
			throw error;
		}
	},

	queue: async (
		batch: MessageBatch<StatsQueueMessage>,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> => {
		try {
			parseEnv(env);
			await consumeStatsQueue(batch, env, ctx);
		} catch (error) {
			ctx.waitUntil(
				captureApiError(error, { handler: 'queue', queue: batch.queue }),
			);
			throw error;
		}
	},
} satisfies ExportedHandler<Env, StatsQueueMessage>;

export default worker;
