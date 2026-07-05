import { error } from 'itty-router';

import router, { corsify } from './router';

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
				const resp = error(error_);
				// Our jsDelivr proxy will fallback to one hour if no cache-control is set
				resp.headers.set('Cache-Control', 'max-age=0');
				return resp;
			})
			.then(corsify);
	},
};
