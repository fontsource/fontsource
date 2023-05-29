import { IRequestStrict, Router, error, text, StatusError } from 'itty-router';
import { CFRouterContext, FileGenerator } from './types';
import { updateBucket } from './update';

interface DownloadRequest extends IRequestStrict {
	id: string;
	file: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.post('/v1/*', async (request, env, _ctx) => {
	const body = await request.json<FileGenerator>();
	if (!body) {
		return error(404, 'Not Found.');
	}

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
