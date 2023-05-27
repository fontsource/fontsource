import fontsRouter from './fonts/router';
import fontlistRouter from './fontlist/router';

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname.startsWith('/fontlist')) {
			return fontlistRouter.handle(request, env, ctx);
		}

		if (url.pathname.startsWith('/v1/fonts/')) {
			return fontsRouter.handle(request, env, ctx);
		}

		return new Response('Not Found.', { status: 404 });
	},
};
