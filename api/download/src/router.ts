import { IRequestStrict, Router, error, text, withParams } from 'itty-router';
import { CFRouterContext, IDResponse } from './types';
import { updateBucket } from './update';

interface DownloadRequest extends IRequestStrict {
	id: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/download/:id', withParams, async (request, env, _ctx) => {
	const id = request.id;

	// Get id from kv
	const data = await env.FONTS.get<IDResponse>(id, { type: 'json' });
	if (!data) {
		return error(404, 'Not Found.');
	}

	await updateBucket(data, env);
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
