import { error, type IRequestStrict, Router, withParams } from 'itty-router';

import type { CFRouterContext } from '../types';

interface DownloadRequest extends IRequestStrict {
	id: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/v1/download/:id', withParams, async (request, _env, _ctx) => {
	const { id } = request;
	return Response.redirect(
		`https://r2.fontsource.org/fonts/${id}@latest/download.zip`,
		302,
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
