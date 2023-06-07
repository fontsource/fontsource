import { error } from 'itty-router';

import downloadRouter from './download/router';
import fontlistRouter from './fontlist/router';
import fontsRouter from './fonts/router';

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		try {
			const url = new URL(request.url);

			if (url.pathname.startsWith('/fontlist')) {
				return await fontlistRouter
					.handle(request, env, ctx)
					.catch((error_) => {
						console.error(error_);
						return error(error_);
					});
			}

			if (url.pathname.startsWith('/v1/fonts')) {
				return await fontsRouter.handle(request, env, ctx).catch((error_) => {
					console.error(error_);
					return error(error_);
				});
			}

			if (url.pathname.startsWith('/v1/download')) {
				return await downloadRouter
					.handle(request, env, ctx)
					.catch((error_) => {
						console.error(error_);
						return error(error_);
					});
			}

			return error(
				404,
				'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
			);
		} catch (error_) {
			console.error(error_);
			return error(500, 'Internal Server Error.');
		}
	},
};
