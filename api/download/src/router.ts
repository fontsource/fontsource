import { getMetadata } from 'common-api/util';
import {
	error,
	type IRequestStrict,
	Router,
	text,
	withParams,
} from 'itty-router';

import { type CFRouterContext } from './types';
import {
	bucketPath,
	downloadFile,
	downloadManifest,
	generateZip,
} from './update';
import { generateManifest, generateManifestItem } from './util';

interface DownloadRequest extends IRequestStrict {
	id: string;
	file: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.post('/v1/:id', withParams, async (request, env, _ctx) => {
	const { id } = request;
	const fontId = id.split('@')[0];

	const metadata = await getMetadata(fontId, request.clone(), env);
	if (!metadata) {
		return error(404, 'Not Found. Font does not exist.');
	}

	const baseManifest = await generateManifest(id, metadata);

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

	await downloadManifest(manifest, env);
	await generateZip(manifest[0].id, manifest[0].version, request, env);

	return text('Success.');
});

router.post('/v1/:id/:file', withParams, async (request, env, _ctx) => {
	const { id, file } = request;
	const fontId = id.split('@')[0];

	const metadata = await getMetadata(fontId, request.clone(), env);
	if (!metadata) {
		return error(404, 'Not Found. Font does not exist.');
	}

	const manifestItem = await generateManifestItem(id, file, metadata);
	await downloadFile(manifestItem, env);

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
