import router from './router';
import { error } from 'itty-router';

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		try {
			return router.handle(request, env, ctx);
		} catch (e) {
			console.error(e);
			return error(500, 'Internal Server Error.');
		}
	},
};
