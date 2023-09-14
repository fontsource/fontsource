import { getMetadata } from 'common-api/util';
import {
	error,
	type IRequestStrict,
	json,
	Router,
	withParams,
} from 'itty-router';

import {
	generateManifest,
	generateManifestItem,
	pruneManifest,
} from './manifest';
import { type CFRouterContext } from './types';
import { downloadFile, downloadManifest, generateZip } from './update';

interface DownloadRequest extends IRequestStrict {
	tag: string;
	file: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.post('/v1/download/:tag', withParams, async (request, env, _ctx) => {
	const { tag } = request;
	const [id, version] = tag.split('@');
	if (!id || !version) {
		return error(400, 'Bad Request. Invalid font tag in URL.');
	}

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

	return json({ status: 201, message: 'Success.' }, { status: 201 });
});

router.post(
	'/v1/download/:tag/:file',
	withParams,
	async (request, env, _ctx) => {
		const { tag, file } = request;
		const id = tag.split('@')[0];

		const metadata = await getMetadata(id, request, env);
		if (!metadata) {
			return error(404, 'Not Found. Font does not exist.');
		}

		const manifestItem = await generateManifestItem(tag, file, metadata);
		await downloadFile(manifestItem, env);

		return json({ status: 201, message: 'Success.' }, { status: 201 });
	},
);

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
