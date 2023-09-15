import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { downloadFile } from '@/utils/download/download';
import { generateManifestItem } from '@/utils/download/manifest';
import { getMetadata } from '@/utils/metadata/metadata.server';

export const loader: LoaderFunction = async () => {
	return redirect('/');
};

export const action: ActionFunction = async ({ request, params }) => {
	const { tag, file } = params;
	const header = request.headers.get('Authorization');
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	if (!header || header !== `Bearer ${process.env.UPDATE_TOKEN!}`) {
		throw new Response('Invalid update bearer token', { status: 401 });
	}

	if (!tag) {
		throw new Response('Bad Request. Missing font tag in URL.', {
			status: 400,
		});
	}
	if (!file) {
		throw new Response('Bad Request. Missing file in URL.', {
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

	const manifestItem = await generateManifestItem(tag, file, metadata);
	await downloadFile(manifestItem);

	return new Response('Success!', { status: 201 });
};
