import { createCors, error, Router } from 'itty-router';

import downloadRouter from './download/router';
import fontlistRouter from './fontlist/router';
import fontsRouter from './fonts/router';

const { preflight, corsify } = createCors({
	origins: ['*'],
	methods: ['GET'],
});

const router = Router();

router.all('*', preflight);

router.get('/fontlist', fontlistRouter.handle);
router.get('/v1/fonts', fontsRouter.handle);
router.get('/v1/download', downloadRouter.handle);
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
	)
);

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		return await router
			.handle(request, env, ctx)
			.catch((error_) => {
				console.error(error_);
				return error(error_);
			})
			.then(corsify);
	},
};
