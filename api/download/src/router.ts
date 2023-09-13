import { getMetadata } from 'common-api/util';
import {
	error,
	type IRequestStrict,
	Router,
	text,
	withParams,
} from 'itty-router';

import { type CFRouterContext } from './types';
import { downloadFile, downloadManifest, generateZip } from './update';
import { generateManifest, generateManifestItem, pruneManifest } from './util';

interface DownloadRequest extends IRequestStrict {
	tag: string;
	file: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.post('/v1/:tag', withParams, async (request, env, _ctx) => {
	const { tag } = request;
	const id = tag.split('@')[0];

	const metadata = await getMetadata(id, request, env);
	if (!metadata) {
		return error(404, 'Not Found. Font does not exist.');
	}

	const baseManifest = await generateManifest(tag, metadata);
	const manifest = await pruneManifest(tag, baseManifest, env);

	await downloadManifest(manifest, env);
	await generateZip(
		manifest[0].id,
		manifest[0].version,
		metadata,
		request,
		env,
	);

	return text('Success.');
});

router.post('/v1/:tag/:file', withParams, async (request, env, _ctx) => {
	const { tag, file } = request;
	const id = tag.split('@')[0];

	const metadata = await getMetadata(id, request, env);
	if (!metadata) {
		return error(404, 'Not Found. Font does not exist.');
	}

	const manifestItem = await generateManifestItem(tag, file, metadata);
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
