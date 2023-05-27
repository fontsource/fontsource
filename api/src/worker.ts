import fontsRouter from './fonts/router';

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname.startsWith('/v1/fonts/')) {
			return fontsRouter.handle(request);
		}

		return new Response('Not Found.', { status: 404 });
	},
};
