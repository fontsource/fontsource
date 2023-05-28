import { IRequestStrict, Router, error, withParams } from 'itty-router';
import { CFRouterContext } from './types';
import { updateBucket } from './update';

interface DownloadRequest extends IRequestStrict {
	id: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/v1/download/:id', withParams, async (request, env, _ctx) => {
	const id = request.id;

	await updateBucket(id, env);
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
	)
);

export default router;
