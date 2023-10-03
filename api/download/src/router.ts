import {
	error,
	type IRequestStrict,
	json,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import {
	downloadFile,
	downloadManifest,
	downloadVariableFile,
	generateZip,
} from './download';
import {
	generateManifest,
	generateManifestItem,
	generateVariableManifestItem,
	pruneManifest,
} from './manifest';
import { getMetadata, verifyAuth } from './util';

interface DownloadRequest extends IRequestStrict {
	tag: string;
	file: string;
}

const router = Router<DownloadRequest>();

router.get('/ping', () =>
	json({ status: 200, message: 'Pong.' }, { status: 200 }),
);

router.all('*', verifyAuth);

/* Zip file download */
router.post('/:tag', withParams, async (request) => {
	const { tag } = request;
	const [id, version] = tag.split('@');
	if (!id || !version) {
		throw new StatusError(400, 'Bad Request. Invalid font tag in URL.');
	}

	const metadata = await getMetadata(id);
	const baseManifest = generateManifest(tag, metadata);
	const manifest = await pruneManifest(id, version, baseManifest);

	if (baseManifest[0].version !== version) {
		throw new StatusError(400, 'Bad Request. Invalid font tag.');
	}

	await downloadManifest(manifest);
	await generateZip(id, version, metadata);

	return json({ status: 201, message: 'Success.' }, { status: 201 });
});

/* Static font file download */
router.post('/:tag/:file', withParams, async (request) => {
	const { tag, file } = request;
	const [id, version] = tag.split('@');
	if (!id || !version) {
		return error(400, 'Bad Request. Invalid font tag in URL.');
	}

	const metadata = await getMetadata(id);
	const manifestItem = generateManifestItem(tag, file, metadata);
	await downloadFile(manifestItem);

	return json({ status: 201, message: 'Success.' }, { status: 201 });
});

/* Variable font file download */
router.post('/v/:tag/:file', withParams, async (request, env, _ctx) => {
	const { tag, file } = request;
	const [id, version] = tag.split('@');
	if (!id || !version) {
		throw new StatusError(400, 'Bad Request. Invalid font tag in URL.');
	}

	const metadata = await getMetadata(id);

	const manifestItem = generateVariableManifestItem(tag, file, metadata);
	await downloadVariableFile(manifestItem);

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
