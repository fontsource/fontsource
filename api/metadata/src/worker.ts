import { error } from 'itty-router';

import { fontlistQueries } from './fontlist/types';
import { updateList, updateMetadata } from './fontlist/update';
import { updateArrayMetadata } from './fonts/update';
import { corsify, router } from './router';
import { updatePackageStatAll } from './stats/update';
import { updateAxisRegistry, updateVariableList } from './variable/update';

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		return await router
			.handle(request, env, ctx)
			.catch((error_) => {
				console.error(error_);
				return error(error_);
			})
			.then(corsify);
	},

	// This is a daily scheduled event to update the metadata.
	async scheduled(
		_event: ScheduledEvent,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		// Update fontlist and aggregate metadata object.
		await updateMetadata(env, ctx);
		for (const type of fontlistQueries) {
			await updateList(type, env, ctx);
		}

		// Update the metadata arr. We'll let the rest of the individual font ids expire
		// and update on their own.
		await updateArrayMetadata(env, ctx);

		// Update variable lists.
		await updateAxisRegistry(env, ctx);
		await updateVariableList(env, ctx);

		// Update stats.
		await updatePackageStatAll(env, ctx);
		// TODO: Versions
	},
};
