import fontsRouter from './fonts/router';
import fontlistRouter from './fontlist/router';
import downloadRouter from './download/router';
import { error } from 'itty-router';

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		try {
			const url = new URL(request.url);

			if (url.pathname.startsWith('/fontlist')) {
				return fontlistRouter.handle(request, env, ctx).catch((err) => {
					console.error(err);
					return error(err);
				});
			}

			if (url.pathname.startsWith('/v1/fonts')) {
				return fontsRouter.handle(request, env, ctx).catch((err) => {
					console.error(err);
					return error(err);
				});
			}

			if (url.pathname.startsWith('/v1/download')) {
				return downloadRouter.handle(request, env, ctx).catch((err) => {
					console.error(err);
					return error(err);
				});
			}

			return error(
				404,
				'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
			);
		} catch (e) {
			console.error(e);
			return error(500, 'Internal Server Error.');
		}
	},
};
