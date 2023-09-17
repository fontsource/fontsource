import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { downloadManifest, generateZip } from '@/utils/download/download';
import { generateManifest, pruneManifest } from '@/utils/download/manifest';
import { getMetadata } from '@/utils/metadata/metadata.server';

export const loader: LoaderFunction = async () => {
	return redirect('/');
};

export const action: ActionFunction = async ({ request, params }) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) {
		throw new Response('Unauthorized. Missing authorization header.', {
			status: 401,
		});
	}
	const [scheme, encoded] = authHeader.split(' ');

	// The Authorization header must start with Bearer, followed by a space.
	if (!encoded || scheme !== 'Bearer') {
		throw new Response('Bad Request. Malformed authorization header.', {
			status: 400,
		});
	}

	if (encoded !== process.env.UPLOAD_KEY) {
		throw new Response('Unauthorized. Invalid authorization token.', {
			status: 401,
		});
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

	if (baseManifest[0].version !== version) {
		throw new Response('Bad Request. Invalid font tag.', {
			status: 400,
		});
	}

	await downloadManifest(manifest);
	await generateZip(id, version, metadata);

	return new Response('Success!', { status: 201 });
};
