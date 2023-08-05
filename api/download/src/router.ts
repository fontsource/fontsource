import { type IDResponse } from 'common-api/types';
import {
	error,
	type IRequestStrict,
	Router,
	text,
	withParams,
} from 'itty-router';

import { type CFRouterContext, type Manifest } from './types';
import { bucketPath, downloadManifest, generateZip } from './update';
import { generateManifest } from './util';

interface DownloadRequest extends IRequestStrict {
	id: string;
	file: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

const handleManifest = async (
	manifest: Manifest[],
	env: Env,
	ctx: ExecutionContext,
) => {
	// Workers have limited resources, so we need to split up the manifest into
	// chunks of 35 files
	if (manifest.length > 35) {
		const nextManifest = manifest.splice(35);
		// Post to manifest route to continue rest of downloads
		const manifestRequest = new Request('/v1/manifest', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(nextManifest),
		});

		env.DOWNLOAD.fetch(manifestRequest);
	}

	// Download current manifest
	await downloadManifest(manifest, env);

	if (manifest.length < 35) {
		// If this is the only manifest, we can generate a zip file
		await generateZip(manifest[0].id, manifest[0].version, env);
	}
};

router.post('/v1/:id', withParams, async (request, env, ctx) => {
	const { id } = request;

	const metadata = await env.FONTS.get<IDResponse>(id, 'json');
	if (!metadata) {
		return error(404, 'Not Found. Font does not exist.');
	}

	const baseManifest = generateManifest(id, metadata);

	// Search for a list of existing files and prune out those that already exist
	const existingFiles = await env.BUCKET.list({
		prefix: `${id}/`,
	});

	const manifest = baseManifest.filter((file) => {
		const existingFile = existingFiles.objects.find((existingFile) => {
			return existingFile.key === bucketPath(file);
		});

		return !existingFile;
	});

	await handleManifest(manifest, env, ctx);

	return text('Success.');
});

router.post('/v1/:id/:file', async (request, env, ctx) => {});

router.post('/v1/manifest', async (request, env, ctx) => {
	const manifest = await request.json<Manifest[]>();

	await handleManifest(manifest, env, ctx);

	return text('Success.');
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
