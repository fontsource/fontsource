import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { downloadManifest, generateZip } from '@/utils/download/download';
import { generateManifest, pruneManifest } from '@/utils/download/manifest';
import { getMetadata } from '@/utils/metadata/metadata.server';

export const loader: LoaderFunction = async () => {
	return redirect('/');
};

export const action: ActionFunction = async ({ request, params }) => {
	const header = request.headers.get('Authorization');
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	if (!header || header !== `Bearer ${process.env.UPDATE_TOKEN!}`) {
		throw new Response('Invalid update bearer token', { status: 401 });
	}

	const tag = params.tag;
	if (!tag) {
		throw new Response('Bad Request. Missing font tag in URL.', {
			status: 400,
		});
	}

	const [id, version] = tag.split('@');
	if (!id || !version) {
		throw new Response('Bad Request. Invalid font tag.', { status: 400 });
	}

	const metadata = await getMetadata(id);
	if (!metadata) {
		throw new Response('Not Found. Font does not exist.', { status: 404 });
	}

	const baseManifest = await generateManifest(tag, metadata);
	const manifest = await pruneManifest(id, version, baseManifest);

	await downloadManifest(manifest);
	await generateZip(id, version, metadata);

	return new Response('Success!', { status: 201 });
};
