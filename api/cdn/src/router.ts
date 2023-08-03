import {
	error,
	type IRequestStrict,
	Router,
	text,
	withParams,
} from 'itty-router';

import type { CFRouterContext } from './types';

interface CDNRequest extends IRequestStrict {
	id: string;
	file: string;
}

const router = Router<CDNRequest, CFRouterContext>();

router.get('/fonts/:id/:file', withParams, async (request, env, _ctx) => {
	const { id, file } = request;

	// Parse version
});

router.post('/v1/*', async (request, env, _ctx) => {
	return text('Success.');
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
	)
);

export default router;
