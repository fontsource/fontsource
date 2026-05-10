import { app } from './app';

export { ArtifactBuilder } from './container/binding';

import { parseEnv } from './env';
import {
	refreshAxisRegistry,
	refreshCatalog,
	refreshStats,
} from './features/metadata/refresh';

/**
 * Worker entrypoint.
 *
 * `fetch` serves the public API/CDN surface, while `scheduled` keeps the
 * frequently requested metadata blobs warm in KV.
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
		_event: ScheduledController,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<void> => {
		parseEnv(env);

		await Promise.all([
			refreshCatalog(env),
			refreshAxisRegistry(env),
			refreshStats(env),
		]);
	},
};

export default worker;
