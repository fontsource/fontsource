import { error } from 'itty-router';

import router from './router';

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		return await router.fetch(request, env, ctx).catch((error_) => {
			console.error(error_);
			return error(error_);
		});
	},
};
