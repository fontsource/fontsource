import {
	error,
	type IRequestStrict,
	json,
	Router,
	withParams,
} from 'itty-router';

import { type CFRouterContext } from './types';

interface DownloadRequest extends IRequestStrict {
	path: string;
	prefix: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/list/:prefix+', withParams, async (request, env, _ctx) => {
	const { prefix } = request;
	if (!prefix) return error(400, 'Bad Request. Prefix is required.');

	const list = await env.BUCKET.list({ prefix });
	const objects = list.objects.map((object) => object.key);

	return json({ status: 200, objects }, { status: 200 });
});

router.get('/get/:path+', withParams, async (request, env, _ctx) => {
	const { path } = request;
	if (!path) return error(400, 'Bad Request. Path is required.');

	const object = await env.BUCKET.get(path);
	if (!object) {
		return error(404, `Not Found. Object ${path} does not exist.`);
	}

	return new Response(await object.arrayBuffer(), {
		status: 200,
	});
});

router.put('/put/:path+', withParams, async (request, env, _ctx) => {
	const { path } = request;
	if (!path) return error(400, 'Bad Request. Path is required.');

	const body = await request.arrayBuffer();
	await env.BUCKET.put(path, body);
	return json({ status: 201, message: 'Success.' }, { status: 201 });
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
