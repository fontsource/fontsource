import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import invariant from 'tiny-invariant';

import { getCss } from '@/utils/css.server';

export const loader: LoaderFunction = async ({ params, request }) => {
	invariant(params.id, 'Font ID is required');
	const url = new URL(request.url);
	const css = await getCss(params.id, {
		index: url.searchParams.get('all') === 'true' ? false : true,
		all: url.searchParams.get('all') === 'true' ? true : false,
		variable: url.searchParams.get('variable') === 'true' ? true : false,
	});

	return json({ css });
};
