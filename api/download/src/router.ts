import { error, type IRequestStrict, Router, text } from 'itty-router';

import type { CFRouterContext, FileGenerator } from './types';
import { updateBucket } from './update';

interface DownloadRequest extends IRequestStrict {
	id: string;
	file: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.post('/v1/*', async (request, env, _ctx) => {
	const body = await request.json<FileGenerator>();

	await updateBucket(body, env);
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
