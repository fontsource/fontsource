import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { updateAlgoliaIndex } from '@/utils/algolia.server';
import { populateDocsCache } from '@/utils/mdx/mdx.server';

interface UpdateData {
	algolia?: boolean;
	download?: boolean;
	axisRegistry?: boolean;
	docs?: boolean;
	force?: boolean;
}

export const loader: LoaderFunction = async () => {
	return redirect('/');
};

export const action: ActionFunction = async ({ request }) => {
	const data: UpdateData | undefined = await request.json();
	const header = request.headers.get('Authorization');
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	if (!header || header !== `Bearer ${process.env.UPDATE_TOKEN!}`) {
		throw new Response('Invalid update bearer token', { status: 401 });
	}
	if (!data) {
		throw new Response('Invalid update data', { status: 400 });
	}

	if (data.docs) {
		console.log('Resetting cache for docs');
		await populateDocsCache();
	}

	if (data.algolia) {
		console.log('Updating algolia index');
		await updateAlgoliaIndex(data.force);
	}

	return new Response('Success!');
};
