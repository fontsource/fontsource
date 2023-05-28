import { CFRouterContext } from '../types';
import { IRequestStrict, Router, error, withParams } from 'itty-router';

interface DownloadRequest extends IRequestStrict {
	id: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/v1/download/:id', withParams, async (request, env, _ctx) => {
	const id = request.id;

	// Check if download.zip exists in bucket
	let zip = await env.BUCKET.get(`${id}@latest/download.zip`);
	if (!zip) {
		// Try calling download worker
		await env.DOWNLOAD.fetch(request.clone());

		// Check again if download.zip exists in bucket
		zip = await env.BUCKET.get(`${id}@latest/download.zip`);
		if (!zip) {
			return error(404, 'Not Found.');
		}
	}

	return new Response(zip.body, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${id}.zip"`,
		},
	});
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
	)
);

export default router;
