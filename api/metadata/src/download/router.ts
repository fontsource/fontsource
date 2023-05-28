import { CFRouterContext } from '../types';
import { IRequestStrict, Router, error, json } from 'itty-router';

const router = Router<IRequestStrict, CFRouterContext>();

router.get('/v1/download', async (request, env, _ctx) => {
	const url = new URL(request.url);
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
	)
);

export default router;
