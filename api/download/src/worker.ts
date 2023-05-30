import router from './router';
import { error } from 'itty-router';

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		return router.handle(request, env, ctx).catch((err) => {
			console.error(err);
			return error(err);
		});
	},
};
