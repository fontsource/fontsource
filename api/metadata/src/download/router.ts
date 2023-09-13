import { error, type IRequestStrict, Router, withParams } from 'itty-router';

import type { CFRouterContext } from '../types';

interface DownloadRequest extends IRequestStrict {
	id: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/v1/download/:id', withParams, async (request, env, _ctx) => {
	const { id } = request;

	const tag = `${id}@latest`;
	return Response.redirect(
		`https://cdn.jsdelivr.net/fontsource/${tag}/download.zip`,
		301,
	);
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
